// cargar los modulos
const Scene = require('Scene');
const Patches = require('Patches');
const Persistence = require('Persistence');
const FaceTracking = require('FaceTracking');
const Reactive = require('Reactive');

/* Estas son constantes usadas en el juego para establecer la tolerancia de colisión
detección (`tolerancia`), la posición inicial de los objetos (`inicioPx`), la
separación entre objetos (`sepPx`), y la probabilidad de que aparezca un premio
*/
const tolerancia = 0.03;
const inicioPx = -0.075;
const sepPx = 0.05;
const paramProbabilidad = 0.3;

// mensajes en consola
export const Diagnostics = require('Diagnostics');

//* funciones de utils
import * as utl from './utils.js';

(async function () {
  /* NOTE: variables de inicialización para el juego. */
  let tiempo = 30;
  let score = 0;
  let highScore = 0;
  let actualizarScoreText = "";
  
  //*NOTE: persistencia
  /* Creando una referencia al objeto de almacenamiento local provisto por la Persistencia
   módulo en la API JavaScript de Spark AR Studio. Esto permite que el script almacene
   y recuperar datos localmente en el dispositivo del usuario. */
  const localStorage = Persistence.local; 

  //* NOTE: recupera el score mas alto
  /* Este bloque de código intenta recuperar la puntuación más alta del almacenamiento local mediante
  el método `localStorage.get()` proporcionado por el módulo `Persistence` en el
  API de Spark AR Studio. Primero intenta recuperar la puntuación más alta y registra un
  mensaje que indica si se recuperó correctamente o no. si un error
  ocurre durante el proceso de recuperación, registra un mensaje que indica que la puntuación
  no pudo ser recuperado. */
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
  /* Este código utiliza la asignación de desestructuración para asignar múltiples variables en
   una vez de los valores resueltos de una Promesa devuelta por `Promise.all()`. El
   A Promise se le pasa una serie de promesas que se resuelven en los objetos.
   representando diferentes elementos en la escena Spark AR Studio. las variables
   asignados corresponden a estos elementos y se utilizarán más adelante en el
   código. */
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
  utl.tamanioPantalla(display);

  //*NOTE: Que el planeEscondite siga el rostro.
  /* posición del objeto `planeEscondite`,seguir la posición de la cara del usuario.
   Está utilizando el módulo `FaceTracking` para rastrear la posición de la cara
   del usuario y actualizar la posición `x` e `y` de el objeto `planeEscondite`*/
  planeEscondite.transform.x = FaceTracking.face(0).cameraTransform.position.x;
  planeEscondite.transform.y = FaceTracking.face(0).cameraTransform.position.y;

  //*NOTE: Recupera objetos premio y castigo 
  /* Estas líneas de código usan el método `findByPath()` del módulo `Scene`
  para encontrar todos los objetos en la escena que tienen un patrón de nombre específico. El `**` es
  un comodín que coincida con cualquier número de niveles en la jerarquía de la escena, y
  `tecuich*` y `bad*` son patrones que coinciden con cualquier objeto cuyo nombre comience
  con "tecuich" o "bad", respectivamente. Los objetos resultantes se almacenan en el
  variables `premios` y `castigos`, que se utilizan más adelante en el código para
  inicialice las posiciones de los objetos y agregue detección de colisión. */
  const premios = await Scene.root.findByPath("**/tecuich*");
  const castigos = await Scene.root.findByPath("**/bad*");
 
  //* NOTE: inicia los premios en su lugar
  utl.iniciarObjetos(premios,inicioPx,sepPx);
  utl.iniciarObjetos(castigos,inicioPx,sepPx);

  //* NOTE: Valores iniciales de Score y tiempo 
  textScore.text = `Score: ${score}`;
  textTiempo.text = `${tiempo}`; 

  //*NOTE: inicializar objetos de la barra de tiempo
  //! comentar si el tamaño y la posición se realiza en spark studio
  utl.tamanioYposicion(rectanguloTiempo,57,6,31,8+2,true);
  utl.tamanioYposicion(textTiempo,15,9,7,6.5+2,true);
  utl.tamanioYposicion(textScore,30,9,7,13,true);
  utl.tamanioYposicion(textGameOver,65,13,11,6,true);

  //* NOTE: creacion de la animación para la barra de timepo
  const controladorTiempo = utl.creaControladorTiempo(tiempo);
  // animación lineal a lo ancho
  const animacionRectangulo = utl.animacionLineal(controladorTiempo,rectanguloTiempo.width.pinLastValue(),0);
  rectanguloTiempo.width = animacionRectangulo[1];

  //* NOTE: animación del reloj
  const animacionTiempo = utl.animacionLineal(controladorTiempo,tiempo,0);
  // actualiza el tiempo en pantalla
  animacionTiempo[1].monitor().subscribe(()=>{
    textTiempo.text = `${animacionTiempo[1].round().pinLastValue()}`;
  });

  //* NOTE: agregar las coliciones
  utl.iniciaColiciones(premios,planeEscondite,tolerancia,incrementaScore);
  utl.iniciaColiciones(castigos,planeEscondite,tolerancia,decrementarScore);

  /**
   * La función "comenzarJuego" inicia un juego ocultando ciertos elementos,
   * iniciar animaciones para premios y penalizaciones, y configurar un temporizador que
   * activa una pantalla de fin de juego cuando finaliza.
   */
  function comenzarJuego(){
    rectanguloTiempo.hidden = false;
    textTiempo.hidden = false;
    planeEscondite.hidden = false;
    textScore.hidden = false;
    animacionRectangulo[0].start();
    animacionTiempo[0].start();
    // NOTE: crear animaciónes e iniciarlas para premios y castigos.
    utl.animacionPremios(premios,castigos,animacionTiempo[1],paramProbabilidad);
    
    // si el tiempo termina muestra gameOver
    animacionTiempo[1].eq(0).onOn().subscribe(terminar);
  }

  // NOTE:Terminar 
  /**
   * Esta función oculta varios elementos y muestra un mensaje de fin del juego 
   * con la puntuación del jugador, y envía un pulso a la escena para indicar 
   * que el juego termino.
   */
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
    
    /* `Patches.inputs.setPulse('GameOver',Reactive.once());` está enviando un pulso
     (o evento) al editor de parches con el nombre "GameOver" y un valor de
     `Reactive.once()`, que es una señal que emite un solo evento tan pronto como
     posible. Esto se usa para indicar que el juego ha terminado y activar cualquier
     parches o scripts relevantes en el editor de parches. */
    Patches.inputs.setPulse('GameOver',Reactive.once());
  }


  /**
   * La función disminuye la puntuación y oculta un elemento dado, si la puntuación es
   * mayor que cero decrementa los puntos
   * @param castigo - El parámetro "castigo" es le objeto que tiene que esconder
   */
  function decrementarScore(castigo){
    castigo.hidden = true;
    if(score>0){
      score--;
      textScore.text = `Score: ${score}`;
    }
  }

  /**
   * La función incrementa la puntuación y oculta un elemento dado.
   * @param premio - El parámetro "premio" es le objeto que tiene que esconder
   */
  function incrementaScore(premio){
    premio.hidden = true;
    score++;
    textScore.text = `Score: ${score}`;
  }
  
  
  // * si pulso la pantalla inicia
  /* Estas líneas de código se suscriben a diferentes pulsos (eventos) y llaman
   diferentes funciones cuando esos pulsos son activados. */
  pulseStar.subscribe(comenzarJuego);
})();