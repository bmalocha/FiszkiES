import type { FlashcardSuggestion } from "../../types";

export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export class GenerationService {
  private readonly topics = {
    daily_routines: [
      {
        polish_word: "budzić się",
        spanish_word: "despertarse",
        example_sentence: "Me despierto a las siete. (Budzę się o siódmej.)",
      },
      {
        polish_word: "myć się",
        spanish_word: "lavarse",
        example_sentence: "Me lavo la cara cada mañana. (Myję twarz każdego ranka.)",
      },
      {
        polish_word: "ubierać się",
        spanish_word: "vestirse",
        example_sentence: "Me visto rápidamente. (Ubieram się szybko.)",
      },
      {
        polish_word: "śniadanie",
        spanish_word: "desayuno",
        example_sentence: "Tomo el desayuno a las ocho. (Jem śniadanie o ósmej.)",
      },
      {
        polish_word: "iść do pracy",
        spanish_word: "ir al trabajo",
        example_sentence: "Voy al trabajo en autobús. (Jadę do pracy autobusem.)",
      },
      {
        polish_word: "wracać do domu",
        spanish_word: "volver a casa",
        example_sentence: "Vuelvo a casa a las cinco. (Wracam do domu o piątej.)",
      },
      {
        polish_word: "gotować obiad",
        spanish_word: "preparar la comida",
        example_sentence: "Preparo la comida para mi familia. (Gotuję obiad dla rodziny.)",
      },
      {
        polish_word: "odpoczywać",
        spanish_word: "descansar",
        example_sentence: "Descanso un poco después del trabajo. (Odpoczywam trochę po pracy.)",
      },
      {
        polish_word: "oglądać telewizję",
        spanish_word: "ver la televisión",
        example_sentence: "Veo la televisión por la noche. (Oglądam telewizję wieczorem.)",
      },
      {
        polish_word: "iść spać",
        spanish_word: "irse a dormir",
        example_sentence: "Me voy a dormir a las once. (Idę spać o jedenastej.)",
      },
    ],
    food_and_restaurant: [
      {
        polish_word: "zamawiać",
        spanish_word: "pedir",
        example_sentence: "¿Puedo pedir el menú? (Czy mogę prosić o menu?)",
      },
      {
        polish_word: "rachunek",
        spanish_word: "la cuenta",
        example_sentence: "La cuenta, por favor. (Poproszę rachunek.)",
      },
      {
        polish_word: "przystawka",
        spanish_word: "entrante",
        example_sentence: "De entrante quiero una sopa. (Na przystawkę chcę zupę.)",
      },
      {
        polish_word: "danie główne",
        spanish_word: "plato principal",
        example_sentence: "El plato principal es pescado. (Daniem głównym jest ryba.)",
      },
      {
        polish_word: "deser",
        spanish_word: "postre",
        example_sentence: "¿Qué hay de postre? (Co jest na deser?)",
      },
      {
        polish_word: "kelner",
        spanish_word: "camarero",
        example_sentence: "El camarero es muy amable. (Kelner jest bardzo miły.)",
      },
      {
        polish_word: "rezerwacja",
        spanish_word: "reserva",
        example_sentence: "Tengo una reserva para dos. (Mam rezerwację dla dwóch osób.)",
      },
      {
        polish_word: "stolik",
        spanish_word: "mesa",
        example_sentence: "¿Tiene una mesa libre? (Czy ma pan wolny stolik?)",
      },
      {
        polish_word: "napój",
        spanish_word: "bebida",
        example_sentence: "¿Qué bebida quieres? (Jaki napój chcesz?)",
      },
      {
        polish_word: "smacznego",
        spanish_word: "buen provecho",
        example_sentence: "¡Buen provecho! (Smacznego!)",
      },
    ],
    shopping: [
      {
        polish_word: "sklep",
        spanish_word: "tienda",
        example_sentence: "La tienda está cerrada. (Sklep jest zamknięty.)",
      },
      {
        polish_word: "przymierzać",
        spanish_word: "probarse",
        example_sentence: "Me pruebo estos pantalones. (Przymierzam te spodnie.)",
      },
      {
        polish_word: "rozmiar",
        spanish_word: "talla",
        example_sentence: "¿Qué talla necesitas? (Jakiego rozmiaru potrzebujesz?)",
      },
      {
        polish_word: "przecena",
        spanish_word: "rebaja",
        example_sentence: "Hay rebajas en esta tienda. (W tym sklepie są przeceny.)",
      },
      {
        polish_word: "kasa",
        spanish_word: "caja",
        example_sentence: "La caja está al fondo. (Kasa jest w głębi.)",
      },
      {
        polish_word: "przymierzalnia",
        spanish_word: "probador",
        example_sentence: "El probador está ocupado. (Przymierzalnia jest zajęta.)",
      },
      {
        polish_word: "paragon",
        spanish_word: "ticket",
        example_sentence: "¿Necesita el ticket? (Potrzebuje pan paragon?)",
      },
      {
        polish_word: "koszyk",
        spanish_word: "cesta",
        example_sentence: "Cojo una cesta para comprar. (Biorę koszyk na zakupy.)",
      },
      {
        polish_word: "promocja",
        spanish_word: "oferta",
        example_sentence: "Hay una oferta especial. (Jest specjalna promocja.)",
      },
      {
        polish_word: "płacić",
        spanish_word: "pagar",
        example_sentence: "¿Cómo quiere pagar? (Jak chce pan zapłacić?)",
      },
    ],
    health: [
      {
        polish_word: "ból głowy",
        spanish_word: "dolor de cabeza",
        example_sentence: "Tengo dolor de cabeza. (Boli mnie głowa.)",
      },
      {
        polish_word: "gorączka",
        spanish_word: "fiebre",
        example_sentence: "Tiene fiebre alta. (Ma wysoką gorączkę.)",
      },
      {
        polish_word: "przeziębienie",
        spanish_word: "resfriado",
        example_sentence: "Estoy resfriado. (Jestem przeziębiony.)",
      },
      {
        polish_word: "apteka",
        spanish_word: "farmacia",
        example_sentence: "La farmacia está cerca. (Apteka jest blisko.)",
      },
      {
        polish_word: "recepta",
        spanish_word: "receta",
        example_sentence: "Necesito una receta. (Potrzebuję recepty.)",
      },
      {
        polish_word: "lekarz",
        spanish_word: "médico",
        example_sentence: "Voy al médico mañana. (Idę do lekarza jutro.)",
      },
      {
        polish_word: "tabletka",
        spanish_word: "pastilla",
        example_sentence: "Tomo una pastilla cada día. (Biorę tabletkę codziennie.)",
      },
      {
        polish_word: "syrop",
        spanish_word: "jarabe",
        example_sentence: "El jarabe es para la tos. (Syrop jest na kaszel.)",
      },
      {
        polish_word: "alergia",
        spanish_word: "alergia",
        example_sentence: "Tengo alergia al polen. (Mam alergię na pyłki.)",
      },
      {
        polish_word: "wizyta",
        spanish_word: "cita",
        example_sentence: "Tengo una cita con el dentista. (Mam wizytę u dentysty.)",
      },
    ],
    travel: [
      {
        polish_word: "bilet",
        spanish_word: "billete",
        example_sentence: "Necesito un billete de ida y vuelta. (Potrzebuję bilet w obie strony.)",
      },
      {
        polish_word: "walizka",
        spanish_word: "maleta",
        example_sentence: "Mi maleta es grande. (Moja walizka jest duża.)",
      },
      {
        polish_word: "lotnisko",
        spanish_word: "aeropuerto",
        example_sentence: "El aeropuerto está lejos. (Lotnisko jest daleko.)",
      },
      {
        polish_word: "paszport",
        spanish_word: "pasaporte",
        example_sentence: "¿Dónde está mi pasaporte? (Gdzie jest mój paszport?)",
      },
      {
        polish_word: "rezerwacja hotelu",
        spanish_word: "reserva de hotel",
        example_sentence: "Tengo una reserva de hotel. (Mam rezerwację hotelu.)",
      },
      {
        polish_word: "zwiedzać",
        spanish_word: "visitar",
        example_sentence: "Quiero visitar el museo. (Chcę zwiedzić muzeum.)",
      },
      {
        polish_word: "mapa",
        spanish_word: "mapa",
        example_sentence: "Necesito un mapa de la ciudad. (Potrzebuję mapę miasta.)",
      },
      {
        polish_word: "zagubiony",
        spanish_word: "perdido",
        example_sentence: "Estoy perdido. (Jestem zagubiony.)",
      },
      {
        polish_word: "kierunek",
        spanish_word: "dirección",
        example_sentence: "¿Cuál es la dirección? (Jaki jest kierunek?)",
      },
      {
        polish_word: "dworzec",
        spanish_word: "estación",
        example_sentence: "La estación está cerca. (Dworzec jest blisko.)",
      },
    ],
  };

  /**
   * Generates random flashcard suggestions from a randomly selected topic.
   * @returns Array of 5-10 flashcard suggestions without temporary IDs
   */
  async generateFlashcards(): Promise<Omit<FlashcardSuggestion, "id">[]> {
    // Get random topic
    const topics = Object.keys(this.topics);
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    // Get random number of flashcards (between 5 and 10)
    const numberOfCards = Math.floor(Math.random() * 6) + 5;

    // Get random cards from selected topic
    const topicCards = this.topics[randomTopic as keyof typeof this.topics];
    const shuffled = [...topicCards].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, numberOfCards);
  }
}
