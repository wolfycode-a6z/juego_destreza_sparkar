const Reactive = require('Reactive');
const Animation = require('Animation');
// mensajes en consola
export const Diagnostics = require('Diagnostics');

/**
 * Esta función establece el tamaño de respuesta de un objeto en función del
 * tamaño de visualización y valores de tamaño relativos proporcionados
 * @param wDisplay - El ancho de la pantalla en pixeles
 * @param hDisplay - La altura de la pantalla en pixeles
 * @param wRelativo - El ancho relativo del objeto expresado como porcentaje.
 * @param hRelativo - Altura relativa del objeto que se esta redimencionando 
 * @param objeto - Objeto cuyo tamaño debe establecerse de forma receptiva.
 */
export function estableceTamanioResponcivo(wDisplay,hDisplay,wRelativo,hRelativo,objeto){
    // tamaño
    objeto.width = (wDisplay*wRelativo)/100;
    objeto.height = (hDisplay*hRelativo)/100;
}

/**
 * Esta función establece la posición de un objeto en función de la visualización
 * relativa
 * @param wDisplay - El ancho de la pantalla en pixeles
 * @param hDisplay - La altura de la pantalla en pixeles
 * @param wRelativo - El ancho relativo del objeto en porcentaje. Es utilizado para
 * calcular la posición horizontal del objeto en función del ancho de la pantalla
 * @param hRelativo - La altura relativa del objeto en porcentaje. Calcula la posición 
 * verticla del objeto.
 * @param objeto - Objeto cuya posición es calculada
 */
export function establecePosicionReponcivo(wDisplay,hDisplay,wRelativo,hRelativo,objeto){
    // posición
    objeto.transform.position = Reactive.point((wDisplay*wRelativo)/100,(hDisplay*hRelativo)/100,0);
}

/**
 * La funcion establece la posición de los objetosd en una matriz apartir
 * de un punto de inicio
 * @param objArray - matriz con los objetos que tienen que posicionarce
 * @param inicio - Primera posición del objeto.
 * @param sep - Distancia de separación entre los objetos en el array. se utiliza
 * para calcular la posicion de cada objeto.
 */
export function iniciarObjetos(objArray,inicio,sep){
    let x = inicio
    objArray.forEach((obj)=>{
      obj.hidden = true;
      obj.transform.position = Reactive.point(x,0.23,0);
      x+=sep;
    });
}

/**
 * La funcion detecta la colisión entre dos objetos y activa una consecuencia si
 * la colisión está dentro de una cierta tolerancia.
 * @param obj1 - Primer objeto involucrado en la detección de colisión.
 * @param obj2 - Segundo objeto involucrado en la detención de la colisión.
 * @param tolerancia - Representa la tolerancioa o el minimo de distancia entro 
 * los dos objetos para que se detecte la colisión.
 * @param consecuencia - Es una función que es ejecutará cuando los dos objetos
 * chocan dentro de la tolerancia especificada.Es la acción o concecuencia.
 * @returns el valor de la variable `n`, que es el último carácter de la
  * Propiedad `name` de `obj1` analizada como un entero.
 */
export function colisionDosObj(obj1,obj2,tolerancia,consecuencia){
    const n = parseInt((obj1.name[obj1.name.length - 1]));
    const obj2X = obj2.transform.x;
    const obj2Y = obj2.transform.y;
    const obj1X = obj1.transform.x;
    const obj1Y = obj1.transform.y;
    const colisionX = obj2X.sub(obj1X).abs();
    const colisionY = obj2Y.sub(obj1Y).abs();
    colisionX.lt(tolerancia).and(colisionY.lt(tolerancia)).onOn().subscribe(()=>{
        consecuencia(obj1);
    });
    return n;
}


// TODO: documenar
export function animacionLineal(controladorTiempo,inicio,final){
    // controlador de tiempo
    const driverTiempo = Animation.timeDriver(controladorTiempo);
    // crear muestra de la animación - lineal
    const muestraBase = Animation.samplers.linear(inicio,final);
    // creamos una animación conbinando el controlador y la muestra
    const animacion = Animation.animate(driverTiempo,muestraBase);
    return [driverTiempo,animacion];
}

// TODO: documenar
function creaAnimacionPremio(premio,inicio,final){
  premio.hidden = false;
  // FIXME: velocidad
  const driveTiempo = creaControladorTiempo(0,1,false,true,30,90);
  const animacion = animacionLineal(driveTiempo,inicio,final);
  premio.transform.position = Reactive.point(premio.transform.position.x.pinLastValue(),animacion[1],0);
  return animacion[0];
}

// TODO: documentar
export function animacionPremios(premios,castigos,probabilidad,observar){
  premios.forEach((p,i)=>{
    animarPremios(p,castigos[i],probabilidad,observar);
  });
}

// TODO: documentar
function animarPremios(premio,castigo,paramProbabilidad,observar){
  const initY = 0.17;
  // elige si es premio o castigo 
  if(Math.random()>paramProbabilidad){
   var item = premio;
  }else{
    var item = castigo;
  }

  // animar el item premio | castigo
  var ap = creaAnimacionPremio(item,initY,-0.23,observar);
  ap.start();
  // escucha si el premio cae
  premio.transform.position.y.lt(-0.23).onOn().subscribe(()=>{
    // si el timepo no termina continua
    const continua = observar.pinLastValue() > 0;
    const probabilidad = Math.random()>paramProbabilidad;
    // detien la animación 
    ap.stop();
    if(continua){
      if(!probabilidad){
        premio.hidden = true;
        ap = creaAnimacionPremio(castigo,initY,-0.23,observar);
      }else{
        ap = creaAnimacionPremio(premio,initY,-0.23,observar);
      }
      ap.start();
    }
  });

  // premio.transform.position.y.lt()
  castigo.transform.position.y.lt(-0.23).onOn().subscribe(()=>{
    const continua = observar.pinLastValue()>0;
    const probabilidad = Math.random()>paramProbabilidad;
    ap.stop();
    if(continua){
      if(probabilidad){
        castigo.hidden = true;
        ap = creaAnimacionPremio(premio,initY,-0.23,observar);
      }else{
        ap = creaAnimacionPremio(castigo,initY,-0.23,observar);
      }
      ap.start();
    }
  });
}

// TODO: documentar
export function iniciaColiciones(premios,colicion,consecuencia,tolerancia){
  premios.forEach((p)=>{
    colisionDosObj(p,colicion,tolerancia,consecuencia);
  });
}

/**
  * La función crea un objeto controlador de tiempo con duración personalizable, número
  * de iteraciones, duplicación y aleatorización opcional.
  * @param tiempo - La duración del controlador en segundos.
  * @param [repeticiones=1] - La cantidad de veces que el controlador debe repetir su
  * animación. Si no se especifica.
  * @param [espejo=false] - un valor booleano que determina si la animación
  * debe jugar al revés después de completar un ciclo. Si se establece en verdadero, la animación
  * reproducirá hacia adelante y luego hacia atrás. Si se establece en falso, la animación solo
  * jugar hacia adelante.
  * @param [aleatorio=false] - un valor booleano que determina si la duración
  * del controlador debe ser aleatorio o no. Si se establece en verdadero, la duración
  * debe ser un número entero aleatorio entre los valores de los parámetros min y max.
  * @param [min=0] - El valor mínimo para la generación de tiempo aleatorio. 
  * @param [max=0] - El valor máximo para la generación de tiempo aleatorio.
  * @returns La función `creaControladorTiempo` devuelve un objeto con propiedades
  * `durationMilliseconds`, `loopCount` y `mirror`.
  */
export function creaControladorTiempo(tiempo,repeticiones=1,espejo=false,
                                        aleatorio=false,min=0,max=0){
    if(aleatorio || tiempo<0){
      tiempo = aleratorioInt(min,max)/10;
    }
    const controlador = {
      // La duración del controlador
      durationMilliseconds: tiempo*1000,
      // numero de iteraciones
      loopCount: repeticiones,
      // si es de ida y de vuelta
      mirror: espejo
    }
    return controlador;
}


export function aleratorioInt(min, max) {
    return Math.floor( Math.random() * (max - min) + min);
}