// cargar los modulos
const Scene = require('Scene');
const Patches = require('Patches');
const Reactive = require('Reactive');
const Animation = require('Animation');

// mensajes en consola
export const Diagnostics = require('Diagnostics');

// posiciones en x de los objetos que van a caer
const posicionesTecuichesX = [-0.075,-0.025,0.025,0.075];

(async function () {  // Enables async/await in JS [part 1]

  // recuperamos los objetos de la scene
  const [rectanguloTiempo,textTiempo,textScore,pulseStar,pulseTecuich] = await Promise.all([
    Scene.root.findFirst('rectanguloTiempo'),
    Scene.root.findFirst('textTiempo'),
    Scene.root.findFirst('textScore'),
    Patches.outputs.getPulse('Star'),
    Patches.outputs.getPulse('TecuichAnimacion'),
  ]);
  
  // inicializar tecuiches
  const tecuiches = await Scene.root.findByPath("**/tecuich*");
  let i = 0;
  tecuiches.forEach(function(tecuich){
    tecuich.hidden = false;
    tecuich.transform.position = Reactive.point(posicionesTecuichesX[i],0.23,0);
    i++;
  });


  // inicializar 
  initBarraDeEstado(rectanguloTiempo,textTiempo,textScore);
  
  // modifica el rectangulo
  function iniciar(){
    animarBarraDeTiempo(rectanguloTiempo,textTiempo);
    caerTecuiche(tecuiches[0]);
  }
  
  // iniciar animación
  function nuevoTecuich(){
    caerTecuiche(tecuiches[0]);
  }

  // si pulso la pantalla inicia
  pulseStar.subscribe(iniciar);
  pulseTecuich.subscribe(nuevoTecuich);
  
})(); // Enables async/await in JS [part 2]

function initBarraDeEstado(rectangulo,tiempo,score){
  tiempo.text = `Timepo: ${45}`;
  score.text = `Score: ${0}`;
  rectangulo.transform.scaleX = 1;
  rectangulo.transform.position = Reactive.point(70,50,0);
  rectangulo.width = 250;
  rectangulo.height = 40;
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
  const muestraBase = Animation.samplers.linear(250,0);
  const muestraBaseTiempo = Animation.samplers.linear(45,0);

  // creamos una animación conbinando el controlador y la muestra
  const animacionRectangulo = Animation.animate(driverTiempo,muestraBase);
  const animacionTiempo = Animation.animate(driverTiempo,muestraBaseTiempo);

  // cambiamos el valor que queremos animar
  rectangulo.width = animacionRectangulo;
  tiempo.text = animacionTiempo.round().toString();

  // mandamos un pulso a la función que esta suscrita cuando termine la animación
  Patches.inputs.setPulse('GameOver',driverTiempo.onCompleted());
}

function caerTecuiche(tecuiche){
  // !Animación
  const baseDriverParameters = {
    durationMilliseconds: 5000,
    loopCount: 1,
    mirror: false
  };

  const baseDriver = Animation.timeDriver(baseDriverParameters);
  baseDriver.start();
      
  const baseSampler = Animation.samplers.linear(0.23,-0.23);
  const baseAnimation = Animation.animate(baseDriver,baseSampler);
  
  tecuiche.transform.position = Reactive.point(-0.075,baseAnimation,0);
  Patches.inputs.setPulse('TermineCaer',baseDriver.onCompleted());
}