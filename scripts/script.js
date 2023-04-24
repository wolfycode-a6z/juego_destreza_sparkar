// cargar los modulos
const Scene = require('Scene');
const Patches = require('Patches');
const Reactive = require('Reactive');
const Animation = require('Animation');
const FaceTracking = require('FaceTracking');
// mensajes en consola
export const Diagnostics = require('Diagnostics');
// ? funciones de utils
import {iniciarObjetos} from './utils.js';
(async function () {  // Enables async/await in JS [part 1]
  // recuperamos los objetos de la scene
  // * NOTE: recuperar objetos de la scena. barra de tiempo
  const objBarraTiempo = await Promise.all([
    Scene.root.findFirst('rectanguloTiempo'),
    Scene.root.findFirst('textScore'),
    Scene.root.findFirst('textVidas'),
    Scene.root.findFirst('textTiempo'),
    Scene.root.findFirst('textGameOver'), 
  ]);
  // * NOTE: recuperar elementos y los pulsos para cambiar de estado
  const [display,planeEscondite,
      pulseStar,pulseOO] = await Promise.all([
      Scene.root.findFirst('display'),
      Scene.root.findFirst('escondite'),
      Patches.outputs.getPulse('Star'),
      Patches.outputs.getPulse('ocultarObjetos'),
  ]);
  
  //*NOTE: Usu del canva display para optener el tamaño del dispositivo 
  const display_width = display.width.pinLastValue();
  const display_height = display.height.pinLastValue();

  // *NOTE: Inicio de variables 
  let score = 0;
  let vidas = 3;

  //*NOTE: Que el escondite siga el rostro
  planeEscondite.transform.x = FaceTracking.face(0).cameraTransform.position.x;
  planeEscondite.transform.y = FaceTracking.face(0).cameraTransform.position.y;

  //*NOTE: Recupera objetos premio
  const premios = await Scene.root.findByPath("**/tecuich*");
  //*NOTE: Recupera objetos castigo
  const castigos = await Scene.root.findByPath("**/bad*");

  // * inicia los premies en su lugar
  iniciarObjetos(premios,-0.075,0.05);


  // TODO: falta progrmar las coliciones
  // ! aqui empieza
  function chocaron(tecuich){
    const n = parseInt((tecuich.name[tecuich.name.length - 1]));
    const tolerancia = 0.03;
    const esconditeX = planeEscondite.transform.x;
    const esconditeY = planeEscondite.transform.y;
    const tecuichX = tecuich.transform.x;
    const tecuichY = tecuich.transform.y;
    const chocaronX = esconditeX.sub(tecuichX).abs();
    const chocaronY = esconditeY.sub(tecuichY).abs();
    chocaronX.lt(tolerancia).and(chocaronY.lt(tolerancia)).onOn().subscribe(()=>{
      if(tecuich.name.includes("tecuich")){
        Diagnostics.log(`Soy ${tecuich.name} y aumento score`);
        incrementaScore(tecuich,n);
      }else{
        Diagnostics.log(`Soy ${tecuich.name} y disminuyo vidas`);
        incrementaScore(tecuich,n);
      }
    });
  }

  // *inicializar 
  initBarraDeEstado(display_width,display_height,objBarraTiempo,score,vidas);
  
  // *modifica el rectangulo
  function iniciar(){
    animarBarraDeTiempo(objBarraTiempo[0],objBarraTiempo[3]);
    for (let i = 0; i < premios.length; i++) {
      animar(premios[i]);
    }
  }

  // ! elige
  function animar(good){
    animarTecuiche(good,objBarraTiempo[0]);
  }

  // * oculata los objetos cuando termina el tiempo
  function ocultar(){
    Diagnostics.log("ya termine perro");
    objBarraTiempo.forEach(function(objeto){
      objeto.hidden = true;
    });
    premios.forEach(function(tecuich){
      tecuich.hidden = true;
    })
    objBarraTiempo[3].hidden = false;
  }
  
  function quitarVidas(vidas){
    vidas--;
  }

  function incrementaScore(tecuich,n){
    tecuich.hidden = true;
    score++;
    objBarraTiempo[1].text = `Score: ${score}`;
    animar(premios[n]);
  }
  
  // * si pulso la pantalla inicia
  pulseStar.subscribe(iniciar);
  pulseOO.subscribe(ocultar);
})(); // Enables async/await in JS [part 2]

function initBarraDeEstado(width,height,objetos_marcador,score,vidas){
  // * rectanguloTiempo tamaño
  objetos_marcador[0].width = (width*70)/100;
  objetos_marcador[0].height = (height*5)/100;
  // * rectanguloTiempo posición vertical y horizontal
  objetos_marcador[0].transform.position = Reactive.point((width*15)/100,(height*8)/100,0);
  // ! TODO: inicializar el texto de score
  // objetos_marcador[1].width = (width*70)/100;
  // objetos_marcador[1].height = (height*5)/100;
  objetos_marcador[1].transform.position = Reactive.point((width*12)/100,(height*13)/100,0);
  objetos_marcador[1].text = `Score: ${score}`;
  objetos_marcador[2].transform.position = Reactive.point((width*12)/100,(height*18)/100,0);
  objetos_marcador[2].text = `Vidas: ${vidas}`;
  // ! TODO: inicializar el texto de tiempo
  objetos_marcador[3].width = (width*50)/100;
  objetos_marcador[3].height = (height*5)/100;
  objetos_marcador[3].transform.position = Reactive.point((width*50)/100,(height*13)/100,0);
  objetos_marcador[3].text =`Tiempo: ${45}`;
  // ! ocultar game over
  objetos_marcador[4].hidden = true;
}

function animarBarraDeTiempo(rectangulo,tiempo){
  // !Animación Crear un conjunto de parámetros de controlador de tiempo
  const paramDriveTiempo = {
    // La duración del controlador
    durationMilliseconds: 45000,
    // numero de iteraciones
    loopCount: 1,
    // si es de ida y de vuelta
    mirror: false
  };

  // controlador de tiempo
  const driverTiempo = Animation.timeDriver(paramDriveTiempo);
  driverTiempo.start();
  
  // crear muestra de la animación - lineal
  const muestraBase = Animation.samplers.linear(rectangulo.width.pinLastValue(),0);
  const muestraBaseTiempo = Animation.samplers.linear(45,0);

  // creamos una animación conbinando el controlador y la muestra
  const animacionRectangulo = Animation.animate(driverTiempo,muestraBase);
  const animacionTiempo = Animation.animate(driverTiempo,muestraBaseTiempo);

  // cambiamos el valor que queremos animar
  rectangulo.width = animacionRectangulo;
  animacionTiempo.monitor().subscribe(()=>{
    tiempo.text = "Tiempo " + animacionTiempo.round().pinLastValue();
  })
  // mandamos un pulso a la función que esta suscrita cuando termine la animación
  Patches.inputs.setPulse('GameOver',driverTiempo.onCompleted());
}

function animarTecuiche(tecuiche,barra){
  const tiempo = aleratorioInt(20,80) * 100;
  const y = 0.23;
  const x = tecuiche.transform.x.pinLastValue();
  // !Animación
  const baseDriverParameters = {
    durationMilliseconds: tiempo,
    loopCount: 1,
    mirror: false
  };
  const baseDriver = Animation.timeDriver(baseDriverParameters);
  baseDriver.start();
      
  const baseSampler = Animation.samplers.linear(y,-y);
  const baseAnimation = Animation.animate(baseDriver,baseSampler);
  
  barra.width.eq(0).onOn().subscribe(()=>{
    baseDriver.stop();
    Diagnostics.log(" ya no")
  })
  tecuiche.transform.position = Reactive.point(x,baseAnimation,0);
  tecuiche.hidden.onOn().subscribe(()=>{
    baseDriver.stop();
  });
}

function aleratorioInt(min, max) {
  return Math.floor( Math.random() * (max - min) + min);
}