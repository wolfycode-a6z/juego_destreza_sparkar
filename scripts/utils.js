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
        consecuencia();
    });
    return n;
}


/**
  * Esta función crea una animación lineal utilizando un controlador de tiempo, 
  * inicio y final.
  * @param controladorTiempo - Un controlador de tiempo que controla la duración
  * repeticiones y el efecto espejo de la animación.
  * @param inicio - El valor inicial de la animación. Este es el valor que el
  * la animación comenzará y cambiará con el tiempo hasta llegar al final
  * valor.
  * @param final - El valor final que alcanzará la animación.
  * @returns La función `animacionLineal` devuelve un objeto de animación que es
  * creado mediante la combinación de un controlador de tiempo y un muestreador lineal.
  */
export function animacionLineal(controladorTiempo,inicio,final){
    // controlador de tiempo
    const driverTiempo = Animation.timeDriver(controladorTiempo);
    driverTiempo.start();
    // crear muestra de la animación - lineal
    const muestraBase = Animation.samplers.linear(inicio,final);
    // creamos una animación conbinando el controlador y la muestra
    const animacionRectangulo = Animation.animate(driverTiempo,muestraBase);
    return animacionRectangulo;
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
      tiempo = aleratorioInt(min,max);
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

// function animacionLineal(controladorTiempo,inicio,final){
//     // controlador de tiempo
//     const driverTiempo = Animation.timeDriver(controladorTiempo);
//     driverTiempo.start();
//     // crear muestra de la animación - lineal
//     const muestraBase = Animation.samplers.linear(inicio,final);
//     // const muestraBaseTiempo = Animation.samplers.linear(45,0);
//     // creamos una animación conbinando el controlador y la muestra
//     const animacionRectangulo = Animation.animate(driverTiempo,muestraBase);
//     // const animacionTiempo = Animation.animate(driverTiempo,muestraBaseTiempo);
//     return animacionRectangulo;
//     // cambiamos el valor que queremos animar
//     // rectangulo.width = animacionRectangulo;
//     // animacionTiempo.monitor().subscribe(()=>{
//     //   tiempo.text = "Tiempo " + animacionTiempo.round().pinLastValue();
//     // })
//     // mandamos un pulso a la función que esta suscrita cuando termine la animación
//     // Patches.inputs.setPulse('GameOver',driverTiempo.onCompleted());
// }