// cargar los modulos
const Scene = require('Scene');
const Patches = require('Patches');
const Reactive = require('Reactive');
const Animation = require('Animation');
const FaceTracking = require('FaceTracking');
// mensajes en consola
export const Diagnostics = require('Diagnostics');
// ? funciones de utils
import * as utl from './utils.js';


(async function () {  // Enables async/await in JS [part 1]
  // recuperamos los objetos de la scene
  // * NOTE: recuperar objetos de la scena. barra de tiempo
  const [rectanguloTiempo,textScore,textVidas,textTiempo,textGameOver,
    display,planeEscondite,pulseStar,pulseOO] = await Promise.all([
    Scene.root.findFirst('rectanguloTiempo'),
    Scene.root.findFirst('textScore'),
    Scene.root.findFirst('textVidas'),
    Scene.root.findFirst('textTiempo'),
    Scene.root.findFirst('textGameOver'),
    Scene.root.findFirst('display'),
    Scene.root.findFirst('escondite'),
    Patches.outputs.getPulse('Star'),
    Patches.outputs.getPulse('ocultarObjetos'),
  ]);
  
  //*NOTE: Usu del canva display para optener el tamaño del dispositivo 
  const display_width = display.width.pinLastValue();
  const display_height = display.height.pinLastValue();

  //*NOTE: Que el planeEscondite siga el rostro
  planeEscondite.transform.x = FaceTracking.face(0).cameraTransform.position.x;
  planeEscondite.transform.y = FaceTracking.face(0).cameraTransform.position.y;

  //*NOTE: Recupera objetos premio
  const premios = await Scene.root.findByPath("**/tecuich*");
  //*NOTE: Recupera objetos castigo
  const castigos = await Scene.root.findByPath("**/bad*");

  //*NOTE: inicializar objetos de la barra de tiempo 
  tamanioYposicion(rectanguloTiempo,display_width,display_height,80,6,10,8,false);
  tamanioYposicion(textScore,display_width,display_height,37,6,10,13,false);
  tamanioYposicion(textVidas,display_width,display_height,37,6,10,16,false);
  tamanioYposicion(textTiempo,display_width,display_height,14,6,75,13,false);
  tamanioYposicion(textGameOver,display_width,display_height,100,7,0,25,true);

  //* NOTE: inicia los premios en su lugar
  utl.iniciarObjetos(premios,-0.075,0.05);
  
  //* NOTE: Inicio de variables clave del juego
  let tiempo = 10;
  let score = 0;
  let vidas = 3;

  // FIXME: inicia las animaciones
  function comenzarJuego(){
    const controladorTiempo = creaControladorTiempo(tiempo);

    rectanguloTiempo.width = utl.animacionLineal(controladorTiempo,rectanguloTiempo.width.pinLastValue(),0);
    const animacionTiempo = utl.animacionLineal(controladorTiempo,tiempo,0);
    Diagnostics.watch("Time:", animacionTiempo);
    animacionTiempo.monitor().subscribe(()=>{
      textTiempo.text = animacionTiempo.round().pinLastValue()+" s";
    });
    animacionTiempo.eq(0).onOn().subscribe(()=>{
      rectanguloTiempo.hidden = true;
      textVidas.hidden = true;
      textScore.hidden = true;
      textTiempo.hidden = true;
      textGameOver.hidden = false;
    });
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
  pulseStar.subscribe(comenzarJuego);
  // pulseOO.subscribe(ocultar);
})(); // Enables async/await in JS [part 2]


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



/**
  * La función establece el tamaño de respuesta y la posición de un objeto y 
  * también puede esconderlo.
  * @param obj - El objeto que necesita ser redimensionado y reposicionado.
  * @param wDispaly - El ancho de la pantalla de visualización.
  * @param hDisplay - La altura de la pantalla donde estará el objeto.
  * @param wTamanio - tamaño del ancho del objeto
  * @param hTamanio - El tamaño de la altura del objeto.
  * @param wPosicion - La posición de ancho del objeto,posición horizontal.
  * @param hPosicion - La posición de altura del objeto,posición vertical.
  * @param oculto - Valor booleano que determina si el objeto debe estar oculto.
  */
function tamanioYposicion(obj,wDispaly,hDisplay,wTamanio,hTamanio,wPosicion,hPosicion,oculto){
  utl.estableceTamanioResponcivo(wDispaly,hDisplay,wTamanio,hTamanio,obj);
  utl.establecePosicionReponcivo(wDispaly,hDisplay,wPosicion,hPosicion,obj);
  obj.hidden = oculto;
}

function creaControladorTiempo(tiempo,repeticiones=1,espejo=false,
  aleatorio=false,min=0,max=0){

  if(aleatorio || tiempo<0){
    tiempo = aleratorioInt(min,max);
  }

  const controlador = {
    // La duración del controlador
    durationMilliseconds: tiempo*1000,
    // numero de iteraciones
    loopCount: 1,
    // si es de ida y de vuelta
    mirror: false
  }
  return controlador;
}