// cargar los modulos
const Scene = require('Scene');
const Patches = require('Patches');
const Reactive = require('Reactive');
const Animation = require('Animation');
const FaceTracking = require('FaceTracking');
// mensajes en consola
export const Diagnostics = require('Diagnostics');
import SceneModule from 'Scene';
// ? funciones de utils
import * as utl from './utils.js';
import { relative } from 'path';


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
  let tiempo = 30;
  let score = 0;
  const vidas = Reactive.val(3);

  // FIXME: inicia las animaciones
  function comenzarJuego(){
    // crea un controlado
    const controladorTiempo = utl.creaControladorTiempo(tiempo);
    // animación lineal a lo ancho
    rectanguloTiempo.width = utl.animacionLineal(controladorTiempo,rectanguloTiempo.width.pinLastValue(),0);
    
    // animación dle tiempo
    const animacionTiempo = utl.animacionLineal(controladorTiempo,tiempo,0);
    // actualiza el tiempo en pantalla
    animacionTiempo.monitor().subscribe(()=>{
      textTiempo.text = animacionTiempo.round().pinLastValue()+" s";
    });

    // * animar los premios - agregar las coliciones
    utl.iniciaColiciones(premios,planeEscondite,incrementaScore,0.03);
    utl.iniciaColiciones(castigos,planeEscondite,quitarVidas,0.03);

    utl.animacionPremios(premios,castigos,animacionTiempo);
    vidas.sub(1);
    vidas.sub(1);
    Diagnostics.watch("vidas: ",vidas);
    // si el tiempo termina muestra gameOver
    animacionTiempo.eq(0).or(vidas.eq(0)).onOn().subscribe(()=>{
      rectanguloTiempo.hidden = true;
      textVidas.hidden = true;
      textScore.hidden = true;
      textTiempo.hidden = true;
      textGameOver.hidden = false;
      premios.forEach((p)=>{
        p.hidden = true;
      });
      castigos.forEach((c)=>{
        c.hidden = true;
      });
    });

  }

  function quitarVidas(castigo){
    castigo.hidden = true;
    vidas.sum(-1);
    textVidas.text = `Vidas: ${vidas.pinLastValue()}`;
  }

  function incrementaScore(premio){
    premio.hidden = true;
    score++;
    textScore.text = `Score: ${score}`;
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