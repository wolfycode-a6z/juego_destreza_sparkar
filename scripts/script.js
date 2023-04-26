// cargar los modulos
const Scene = require('Scene');
const Patches = require('Patches');
const Reactive = require('Reactive');
const Animation = require('Animation');
const Persistence = require('Persistence');
const FaceTracking = require('FaceTracking');

// mensajes en consola
export const Diagnostics = require('Diagnostics');
// ? funciones de utils
import * as utl from './utils.js';

(async function () {
  
  //* NOTE: Inicio de variables clave del juego
  let tiempo = 30;
  let score = 0;
  let highScore = 0;
  const paramProbabilidad = 0.3;
  const tolerancia = 0.03;

  let actualizarScoreText = "";
  // guardar la referencia al localStore
  const localStorage = Persistence.local;
  //* NOTE: recupera el score mas alto
  try {
    highScore = await localStorage.get('highScore');
    if(highScore){
      Diagnostics.log("Se recupero el puntaje = " + highScore.value);
    }else{
      Diagnostics.log("No existe un puntaje");
    }
  } catch (error) {
    Diagnostics.log("No se recupero el puntaje");
  }

  //* NOTE: recuperar objetos de la scena.
  const [rectanguloTiempo,textScore,textTiempo,textGameOver,
    display,planeEscondite,pulseStar] = await Promise.all([
    Scene.root.findFirst('rectanguloTiempo'),
    Scene.root.findFirst('textScore'),
    Scene.root.findFirst('textTiempo'),
    Scene.root.findFirst('textGameOver'),
    Scene.root.findFirst('display'),
    Scene.root.findFirst('escondite'),
    Patches.outputs.getPulse('Star'),
  ]);
  
  //*NOTE: Usu del canva display para optener el tamaño del dispositivo.
  const display_width = display.width.pinLastValue();
  const display_height = display.height.pinLastValue();

  //*NOTE: Que el planeEscondite siga el rostro.
  planeEscondite.transform.x = FaceTracking.face(0).cameraTransform.position.x;
  planeEscondite.transform.y = FaceTracking.face(0).cameraTransform.position.y;

  //*NOTE: Recupera objetos premio 
  const premios = await Scene.root.findByPath("**/tecuich*");
  //*NOTE: Recupera objetos castigo
  const castigos = await Scene.root.findByPath("**/bad*");
  //* NOTE: inicia los premios en su lugar
  utl.iniciarObjetos(premios,-0.075,0.05);
  utl.iniciarObjetos(castigos,-0.075,0.05);

  //*NOTE: inicializar objetos de la barra de tiempo 
  tamanioYposicion(rectanguloTiempo,display_width,display_height,80,6,10,8,true);
  tamanioYposicion(textScore,display_width,display_height,37,6,10,13,true);
  tamanioYposicion(textTiempo,display_width,display_height,14,6,75,13,true);
  tamanioYposicion(textGameOver,display_width,display_height,80,30,10,15,true);
  textScore.text = `Score: ${score}`;
  textTiempo.text = `${tiempo} s`;

  //* NOTE: creacion de la animación para la barra de timepo
  const controladorTiempo = utl.creaControladorTiempo(tiempo);
  // animación lineal a lo ancho
  const animacionRectangulo = utl.animacionLineal(controladorTiempo,rectanguloTiempo.width.pinLastValue(),0);
  rectanguloTiempo.width = animacionRectangulo[1];

  //* NOTE: animación del reloj
  const animacionTiempo = utl.animacionLineal(controladorTiempo,tiempo,0);
  // actualiza el tiempo en pantalla
  animacionTiempo[1].monitor().subscribe(()=>{
    textTiempo.text = animacionTiempo[1].round().pinLastValue()+"s";
  });

  //* NOTE: agregar las coliciones
  utl.iniciaColiciones(premios,planeEscondite,incrementaScore,tolerancia);
  utl.iniciaColiciones(castigos,planeEscondite,decrementarScore,tolerancia);

  //* NOTE: inicia las animaciones
  function comenzarJuego(){
    rectanguloTiempo.hidden = false;
    textScore.hidden = false;
    textTiempo.hidden = false;
    planeEscondite.hidden = false;
    animacionRectangulo[0].start();
    animacionTiempo[0].start();
    // NOTE: crear animaciónes e iniciarlas para premios y castigos.
    utl.animacionPremios(premios,castigos,paramProbabilidad,animacionTiempo[1]);
    // si el tiempo termina muestra gameOver
    animacionTiempo[1].eq(0).onOn().subscribe(terminar);

  }

  // NOTE:Terminar 
  async function terminar(){
    rectanguloTiempo.hidden = true;
    textScore.hidden = true;
    textTiempo.hidden = true;
    premios.forEach((p)=>{
      p.hidden = true;
    });
    castigos.forEach((c)=>{
      c.hidden = true;
    });
    if(highScore && highScore.value>score){
      actualizarScoreText = `Puedes mejorar\nTu puntaje fue más alto\nen la sesión anterior:\n${highScore.value}`;
    }else{
      try {
        await localStorage.set('highScore',{value:score});
        actualizarScoreText = `¡Genial!\nTu puntaje más alto: ${highScore.value}`;
      } catch (error) {
        Diagnostics.log('error puntuación');
      }
    }
    textGameOver.text = actualizarScoreText;
    textGameOver.hidden = false;
    // TODO: animación final particulas 
    // Devuelve un EventSource(pulso) que emite un evento vacío una sola vez, tan pronto como sea posible.
    // Patches.inputs.setPulse('GameOver',Reactive.once())
  }

  function decrementarScore(castigo){
    castigo.hidden = true;
    if(score>0){
      score--;
      textScore.text = `Score: ${score}`;
    }
  }

  function incrementaScore(premio){
    premio.hidden = true;
    score++;
    textScore.text = `Score: ${score}`;
  }
  
  // * si pulso la pantalla inicia
  pulseStar.subscribe(comenzarJuego);
})();


function animarTecuiche(tecuiche,barra){
  const tiempo = aleratorioInt(20,80) * 100;
  const y = 0.23;
  const x = tecuiche.transform.x.pinLastValue();
  //*NOTE: Animación
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
    baseDriver.onCompleted();
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