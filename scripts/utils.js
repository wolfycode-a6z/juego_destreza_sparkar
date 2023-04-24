const Reactive = require('Reactive');

// function initBarraDeEstado(width,height,objetos_marcador,score,vidas){
//     // * rectanguloTiempo tamaño
//     objetos_marcador[0].width = (width*70)/100;
//     objetos_marcador[0].height = (height*5)/100;
//     // * rectanguloTiempo posición vertical y horizontal
//     objetos_marcador[0].transform.position = Reactive.point((width*15)/100,(height*8)/100,0);
//     // ! TODO: inicializar el texto de score
//     // objetos_marcador[1].width = (width*70)/100;
//     // objetos_marcador[1].height = (height*5)/100;
//     objetos_marcador[1].transform.position = Reactive.point((width*12)/100,(height*13)/100,0);
//     objetos_marcador[1].text = `Score: ${score}`;
//     objetos_marcador[2].transform.position = Reactive.point((width*12)/100,(height*18)/100,0);
//     objetos_marcador[2].text = `Vidas: ${vidas}`;
//     // ! TODO: inicializar el texto de tiempo
//     objetos_marcador[3].width = (width*50)/100;
//     objetos_marcador[3].height = (height*5)/100;
//     objetos_marcador[3].transform.position = Reactive.point((width*50)/100,(height*13)/100,0);
//     objetos_marcador[3].text =`Tiempo: ${45}`;
//     // ! ocultar game over
//     objetos_marcador[4].hidden = true;
//   }


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
objeto.transform.position = Reactive.point((wDisplay*wRelativo)/100,(hDisplay*hRelativo)/100);
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