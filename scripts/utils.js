const Reactive = require('Reactive');
const Animation = require('Animation');

// velocidad de la animación rango
const velocidadMax = 15; 
const velocidadMin = 40;

export const visibilidadEnY = 0.17;
export const posicionEnY = 0.16;
export const terminaLaAnimacion = -0.23;

let display_width;
let display_height;

/**
 * La función "tamanioPantalla" recupera el ancho y alto de una pantalla.
 * @param display - El parámetro "display" es el objeto que contiene información 
 * sobre la pantalla de visualización, como su ancho y alto.Toma este objeto 
 * como argumento y le asigna los valores de ancho y alto para las variables 
 * "display_width" y "display_height"
 */
export function tamanioPantalla(display){
  display_width = display.width.pinLastValue();
  display_height =display.height.pinLastValue();
}

/**
 * Esta función establece el tamaño de respuesta de un objeto en función del
 * tamaño de visualización y valores de tamaño relativos proporcionados
 * @param wDisplay - El ancho de la pantalla en pixeles
 * @param hDisplay - La altura de la pantalla en pixeles
 * @param wRelativo - El ancho relativo del objeto expresado como porcentaje.
 * @param hRelativo - Altura relativa del objeto que se esta redimencionando 
 * @param objeto - Objeto cuyo tamaño debe establecerse de forma receptiva.
 */
export function estableceTamanioResponcivo(wRelativo,hRelativo,objeto){
    // tamaño
    objeto.width = (display_width*wRelativo)/100;
    objeto.height = (display_height*hRelativo)/100;
}

/**
 * Esta función establece la posición de un objeto en función de la visualización
 * relativa
 * @param wRelativo - El ancho relativo del objeto en porcentaje. Es utilizado para
 * calcular la posición horizontal del objeto en función del ancho de la pantalla
 * @param hRelativo - La altura relativa del objeto en porcentaje. Calcula la posición 
 * verticla del objeto.
 * @param objeto - Objeto cuya posición es calculada
 */
export function establecePosicionReponcivo(wRelativo,hRelativo,objeto){
    // posición
    objeto.transform.position = Reactive.point((display_width*wRelativo)/100,(display_height*hRelativo)/100,0);
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
    var x = inicio;
    objArray.forEach((obj)=>{
      obj.hidden = true;
      obj.transform.position = Reactive.point(x,posicionEnY,0);
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



/**
 * Esta función crea una animación lineal utilizando un controlador de tiempo y una muestra en
 * Spark AR Studio.
 * @param controladorTiempo - Un controlador de tiempo que controla la duración y el tiempo
 * de la animación.
 * @param inicio - El valor inicial de la animación. Podría ser un número,
 * vector, o valor de color según el contexto de la animación.
 * @param final - El valor final de la animación. Este es el valor que el
 * la animación llegará al final de su duración.
 * @returns La función `animacionLineal` devuelve un array que contiene el tiempo
 * driver(inicia o detiene la animación) y animación(cambia el valor) creados 
 * usando los parámetros de entrada `controladorTiempo`,
 * `inicio`, y `final`.
 */
export function animacionLineal(controladorTiempo,inicio,final){
    // controlador de tiempo
    const driverTiempo = Animation.timeDriver(controladorTiempo);
    // crear muestra de la animación - lineal
    const muestraBase = Animation.samplers.linear(inicio,final);
    // creamos una animación conbinando el controlador y la muestra
    const animacion = Animation.animate(driverTiempo,muestraBase);
    return [driverTiempo,animacion];
}

/**
 * Esta función crea una animación lineal para un objeto de premio dado entre dos
 * posiciones especificadas utilizando un controlador de tiempo.
 * @param premio - El objeto que representa el premio que será animado.
 * @param inicio - La posición inicial de la animación. es un valor numerico
 * que representa la posición inicial del objeto del premio.
 * @param final: el valor final de la animación, que es la posición final de
 * el objeto "premio".
 * @retorna el controlador de animación creado por la función `animacionLineal`.
 */
function creaAnimacionPremio(premio,inicio,final){
  premio.hidden = false;
  const driveTiempo = creaControladorTiempo(0,1,false,true,velocidadMax,velocidadMin);
  const animacion = animacionLineal(driveTiempo,inicio,final);
  premio.transform.position = Reactive.point(premio.transform.position.x.pinLastValue(),animacion[1],0);
  return animacion[0];
}


/**
 * La funcion animacionPremios anima una lista de premios y castigos con un
 * probabilidad dada y observación.
 * @param premios: una matriz de elementos que representan las recompensas que se animarán.
 * @param castigos - Una matriz de objetos que representan las penas o castigos
 * asociado a cada premio de la matriz "premios". La matriz "castigos" debe
 * tener la misma longitud que la matriz "premios".
 * @param observar - Es un driveTime del tiempo para observar cuando se detandra
 * la animación.
 * @param probabilidad - La probabilidad de que ocurra la animación. Donde 0 
 * significa que la animación nunca ocurrirá y 1 significa la animación siempre 
 * ocurrirá.
 */
export function animacionPremios(premios,castigos,observar,probabilidad){
  premios.forEach((p,i)=>{
    animarPremios(p,castigos[i],observar,probabilidad);
  });
}


/**
 * La función anima un elemento de recompensa o castigo elegido al azar y escucha
 * para cuando cae, luego continúa la animación si no se ha cumplido el límite de tiempo
 * alcanzado y elige aleatoriamente otro elemento de recompensa o castigo.
 * @param premio: una variable que representa el elemento de recompensa que se va a animar.
 * @param castigo - Este parámetro representa el elemento que se mostrará como un
 * castigo en la animación.
 * @param observar - Parece que "observar" es una variable o parámetro que es
 * se usa para observar o rastrear algún valor o condición. Es probable que sea un Pin o
 * Observable que se está pasando a la función para monitorear algún aspecto del
 * animación o lógica del juego.
 * @param paramProbabilidad - Este parámetro es un valor de probabilidad entre 0 y 1
 * que determina la probabilidad de que la función elija un "premio" sobre
 * un "castigo" (castigo) al animar el ítem.
 */
function animarPremios(premio,castigo,observar,paramProbabilidad){
  // elige si es premio o castigo 
  if(Math.random()>paramProbabilidad){
   var item = premio;
  }else{
    var item = castigo;
  }

  // animar el item premio | castigo
  var ap = creaAnimacionPremio(item,visibilidadEnY  ,terminaLaAnimacion,observar);
  ap.start();
  // escucha si el premio cae
  premio.transform.position.y.lt(terminaLaAnimacion).onOn().subscribe(()=>{
    // si el timepo no termina continua
    const continua = observar.pinLastValue() > 0;
    const probabilidad = Math.random()>paramProbabilidad;
    // detien la animación 
    ap.stop();
    if(continua){
      if(!probabilidad){
        premio.hidden = true;
        ap = creaAnimacionPremio(castigo,visibilidadEnY,terminaLaAnimacion,observar);
      }else{
        ap = creaAnimacionPremio(premio,visibilidadEnY,terminaLaAnimacion,observar);
      }
      ap.start();
    }
  });

  // premio.transform.position.y.lt()
  castigo.transform.position.y.lt(terminaLaAnimacion).onOn().subscribe(()=>{
    const continua = observar.pinLastValue()>0;
    const probabilidad = Math.random()>paramProbabilidad;
    ap.stop();
    if(continua){
      if(probabilidad){
        castigo.hidden = true;
        ap = creaAnimacionPremio(premio,visibilidadEnY,terminaLaAnimacion,observar);
      }else{
        ap = creaAnimacionPremio(castigo,visibilidadEnY,terminaLaAnimacion,observar);
      }
      ap.start();
    }
  });
}


/**
 * La función "iniciaColiciones" itera a través de una matriz de "premios" y
 * comprueba si hay colisiones con otro objeto "colicion" usando una "tolerancia" dada
 * y aplica una "consecuencia" si se produce una colisión.
 * @param premios - una serie de objetos que representan los premios o castigo en el
 * juego
 * @param colicion - La función utiliza este parámetro para comprobar si hay
 * colisiones entre los "premios" (premios) y el objeto "colicion".
 * @param tolerancia - El parámetro de tolerancia en esta función representa la
 * distancia máxima entre dos objetos antes de que se considere que colisionan.
 * Si la distancia entre dos objetos es menor o igual a la tolerancia
 * valor, entonces se considera que están colisionando.
 * @param consecuencia - El parámetro "consecuencia" es una función que será
 * ejecutada si se produce una colisión entre dos objetos. Es una función de devolución de llamada.
 * que se llamará con el objeto premio como argumento.
 */
export function iniciaColiciones(premios,colicion,tolerancia,consecuencia){
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

/**
 * La función establece el tamaño de respuesta y la posición de un objeto y 
 * también puede esconderlo.
 * @param obj - El objeto que necesita ser redimensionado y reposicionado.
 * @param wTamanio - tamaño del ancho del objeto
 * @param hTamanio - El tamaño de la altura del objeto.
 * @param wPosicion - La posición de ancho del objeto,posición horizontal.
 * @param hPosicion - La posición de altura del objeto,posición vertical.
 * @param oculto - Valor booleano que determina si el objeto debe estar oculto.
 */
export function tamanioYposicion(obj,wTamanio,hTamanio,wPosicion,hPosicion,oculto){
  estableceTamanioResponcivo(wTamanio,hTamanio,obj);
  establecePosicionReponcivo(wPosicion,hPosicion,obj);
  obj.hidden = oculto;
}


/**
 * La función genera un número entero aleatorio entre un valor mínimo y máximo.
 * @param min - El valor mínimo del rango desde el cual el entero aleatorio debería
 * ser generado.
 * @param max - El valor máximo que puede tomar el entero aleatorio.
 * @returns La función `aleratorioInt` devuelve un entero aleatorio entre `min`
 * y valores `max` (inclusive).
 */
export function aleratorioInt(min, max) {
    return Math.floor( Math.random() * (max - min) + min);
}


/**
 * Esta función crea una animación de premioDorado usando una animación lineal
 * controlador y un controlador de tiempo.
 * @param dorado: objeto o entidad en la escena que representa un objeto o personaje dorado.
 * @param animacion - El parámetro animacion es un objeto de Animación Reactiva que
 * controla el tiempo y la progresión de la animación. Se utiliza para iniciar y
 * detener la animación, así como suscribirse a los eventos que ocurren durante la
 * animación.
 */
export function doradoAnimacion(dorado,animacion){
  const controladorTime = creaControladorTiempo(1);
  const ap = animacionLineal(controladorTime,0.17,-0.23);
  dorado.transform.position = Reactive.point(dorado.transform.position.x.pinLastValue(),ap[1],0);
  animacion.lt(16).onOn().subscribe(()=>{
    ap[0].start();
    dorado.hidden = false;
  });
  dorado.transform.position.y.lt(-0.23).onOn().subscribe(()=>{
    dorado.hidden = true;
  })
}