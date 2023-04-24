
const Reactive = require('Reactive');


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

function colicionDosObj(obj1,obj2,tolerancia,siRealiza){
    const n = parseInt((obj1.name[obj1.name.length - 1]));
    const obj2X = obj2.transform.x;
    const obj2Y = obj2.transform.y;
    const obj1X = obj1.transform.x;
    const obj1Y = obj1.transform.y;
    const colicionX = obj2X.sub(obj1X).abs();
    const colicionY = obj2Y.sub(obj1Y).abs();
    colicionX.lt(tolerancia).and(colicionY.lt(tolerancia)).onOn().subscribe(()=>{
        siRealiza();
    });
  }