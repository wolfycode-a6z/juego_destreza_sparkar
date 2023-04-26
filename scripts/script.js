// cargar los modulos
const Scene = require('Scene');
const Patches = require('Patches');
const Persistence = require('Persistence');
const FaceTracking = require('FaceTracking');

// mensajes en consola
export const Diagnostics = require('Diagnostics');

//* funciones de utils
import * as utl from './utils.js';

(async function () {
  
  //* NOTE: Inicio de variables del juego
  let tiempo = 30;
  let score = 0;
  let highScore = 0;
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
  utl.iniciarObjetos(premios);
  utl.iniciarObjetos(castigos);

  //*NOTE: inicializar objetos de la barra de tiempo
  //! comentar si el tamaño y la posición se realiza en spark studio 
  utl.tamanioYposicion(rectanguloTiempo,display_width,display_height,80,6,10,8,true);
  utl.tamanioYposicion(textScore,display_width,display_height,37,6,10,13,true);
  utl.tamanioYposicion(textTiempo,display_width,display_height,14,6,75,13,true);
  utl.tamanioYposicion(textGameOver,display_width,display_height,80,30,10,15,true);
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
  utl.iniciaColiciones(premios,planeEscondite,incrementaScore);
  utl.iniciaColiciones(castigos,planeEscondite,decrementarScore);

  //* NOTE: inicia las animaciones
  function comenzarJuego(){
    rectanguloTiempo.hidden = false;
    textScore.hidden = false;
    textTiempo.hidden = false;
    planeEscondite.hidden = false;
    animacionRectangulo[0].start();
    animacionTiempo[0].start();
    // NOTE: crear animaciónes e iniciarlas para premios y castigos.
    utl.animacionPremios(premios,castigos,animacionTiempo[1]);
    // si el tiempo termina muestra gameOver
    animacionTiempo[1].eq(0).onOn().subscribe(terminar);

  }

  // NOTE:Terminar 
  async function terminar(){
    rectanguloTiempo.hidden = true;
    textScore.hidden = true;
    textTiempo.hidden = true;
    planeEscondite.hidden = true;
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
        actualizarScoreText = `¡Genial!\nTu puntaje más alto: ${score}`;
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