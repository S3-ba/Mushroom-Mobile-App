export type GuideBlock =
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'callout'; tone: 'tip' | 'warn' | 'danger'; title: string; text: string }
  | { t: 'checklist'; items: { id: string; label: string }[] }
  | { t: 'myths'; items: { myth: string; fact: string }[] }
  | { t: 'cta'; label: string; icon: string; target: string | { pathname: string; params?: Record<string, string> } };

export interface GuideSection {
  id: string;
  icon: string;
  title: string;
  blocks: GuideBlock[];
}

/** Beginner's guide – plain data, rendered by <GuideView/>. Works offline. */
export const GUIDE: GuideSection[] = [
  {
    id: 'before',
    icon: 'compass-outline',
    title: 'Zanim wyruszysz',
    blocks: [
      { t: 'p', text: 'Dobra wyprawa zaczyna się w domu. Najlepiej ruszać 2–3 dni po obfitych opadach i przy łagodnych temperaturach — grzyby uwielbiają wilgoć i ciepłe noce.' },
      {
        t: 'list',
        items: [
          'Sprawdź prognozę pogody i godzinę zachodu słońca — w lesie ściemnia się szybciej, niż się wydaje.',
          'Powiedz bliskim, dokąd idziesz, i naładuj telefon. Zasięg w lesie bywa słaby, dlatego pobierz atlas offline w zakładce Atlas.',
          'W parkach narodowych i rezerwatach zbieranie grzybów jest zabronione, a młodniki i uprawy leśne są zamknięte dla wstępu. Stosuj się do oznaczeń i komunikatów nadleśnictwa.',
          'Część gatunków jest objęta ochroną prawną — zbieraj tylko to, co znasz.',
        ],
      },
      { t: 'callout', tone: 'warn', title: 'Sezon polowań', text: 'Jesienią w lasach odbywają się polowania zbiorowe. Załóż jaskrawy lub odblaskowy element ubioru.' },
    ],
  },
  {
    id: 'gear',
    icon: 'bag-handle-outline',
    title: 'Co zabrać ze sobą',
    blocks: [
      { t: 'p', text: 'Dobry ekwipunek to nie kilogramy sprzętu, tylko kilka rzeczy, które realnie pomagają. Odhaczaj na bieżąco — lista zapisuje się w telefonie.' },
      {
        t: 'checklist',
        items: [
          { id: 'basket', label: 'Kosz wiklinowy lub otwarty koszyk' },
          { id: 'knife', label: 'Nożyk z krótkim, czystym ostrzem' },
          { id: 'phone', label: 'Naładowany telefon z pobranym atlasem' },
          { id: 'power', label: 'Powerbank' },
          { id: 'water', label: 'Woda i drugie śniadanie' },
          { id: 'boots', label: 'Wysokie buty lub kalosze, długie spodnie' },
          { id: 'tick', label: 'Repelent na kleszcze i komary' },
          { id: 'vest', label: 'Jaskrawa kamizelka lub czapka' },
          { id: 'map', label: 'Mapa offline lub kompas' },
          { id: 'box', label: 'Osobny pojemnik na grzyby, których nie jesteś pewien' },
          { id: 'whistle', label: 'Gwizdek i mała apteczka' },
          { id: 'stick', label: 'Kij do rozgarniania ściółki' },
        ],
      },
      { t: 'callout', tone: 'warn', title: 'Bez foliowych torebek', text: 'W plastikowej torbie grzyby się parzą i błyskawicznie psują. Kosz zapewnia przewiew.' },
    ],
  },
  {
    id: 'where',
    icon: 'trail-sign-outline',
    title: 'Gdzie szukać',
    blocks: [
      { t: 'p', text: 'Większość popularnych grzybów żyje w symbiozie z drzewami (mikoryza), więc szukaj ich przy właściwych gatunkach.' },
      {
        t: 'list',
        items: [
          'Lasy iglaste (świerk, sosna): borowiki, podgrzybki, maślaki, rydze; kurki w mchu.',
          'Lasy liściaste i mieszane (buk, dąb, grab, brzoza): koźlarze, borowiki, kurki.',
          'Polany, łąki i pobocza: pieczarki polne, twardzioszki, czubajki kanie.',
          'Martwe drewno i pniaki: opieńki i boczniaki.',
        ],
      },
      { t: 'p', text: 'Zaglądaj na skraje lasów, przy ścieżkach, na nasłonecznione stoki i tam, gdzie ściółka jest wilgotna. Wracaj do sprawdzonych miejsc — zapisuj je w zakładce Zbiory, a na Mapie sprawdź, gdzie dany gatunek był obserwowany w Polsce.' },
      { t: 'cta', label: 'Otwórz mapę grzybiarską', icon: 'map', target: '/map' },
    ],
  },
  {
    id: 'when',
    icon: 'calendar-outline',
    title: 'Kiedy zbierać',
    blocks: [
      {
        t: 'list',
        items: [
          'Wiosna (kwiecień–maj): smardze.',
          'Lato (czerwiec–sierpień): kurki, pierwsze borowiki i koźlarze.',
          'Jesień (wrzesień–listopad): główny sezon — borowiki, podgrzybki, rydze, opieńki.',
          'Zima: boczniaki na drzewach liściastych, gdy temperatura jest dodatnia.',
        ],
      },
      { t: 'p', text: 'Najlepiej wyruszać wcześnie rano — grzyby są jędrne, a w lesie jest mniej ludzi. Unikaj upałów i suszy.' },
      { t: 'callout', tone: 'danger', title: 'Uwaga na sobowtóry', text: 'Sezon na śmiertelnie trującego muchomora sromotnikowego (lipiec–listopad) pokrywa się z sezonem na grzyby jadalne.' },
    ],
  },
  {
    id: 'how',
    icon: 'cut-outline',
    title: 'Jak zbierać',
    blocks: [
      {
        t: 'list',
        items: [
          'Ostrożnie wykręć lub wysuń cały owocnik — podstawa trzonu bywa kluczowa do rozpoznania (np. bulwa muchomora).',
          'Dołek po grzybie przykryj ściółką, aby chronić grzybnię.',
          'Zbieraj młode, jędrne okazy; przejrzałe, robaczywe i rozmiękłe zostaw.',
          'Układaj grzyby w koszu luźno, nie warstwami po kilkanaście centymetrów.',
          'Nie depcz grzybów, których nie zbierasz — też pełnią rolę w lesie.',
        ],
      },
      { t: 'callout', tone: 'tip', title: 'Zdjęcie do rozpoznawania', text: 'Sfotografuj okaz z trzech stron: z góry, od spodu i z boku z podstawą trzonu. Tak działa najlepiej.' },
      { t: 'cta', label: 'Rozpoznaj grzyba', icon: 'camera', target: '/recognize' },
    ],
  },
  {
    id: 'safety',
    icon: 'shield-checkmark-outline',
    title: 'Złote zasady bezpieczeństwa',
    blocks: [
      { t: 'callout', tone: 'danger', title: 'Zasada numer jeden', text: 'Jeśli nie masz 100% pewności — zostaw grzyba w lesie. Żadna aplikacja, także ta, nie zastąpi grzyboznawcy.' },
      {
        t: 'list',
        items: [
          'Rozpoznanie ze zdjęcia to tylko podpowiedź. Wątpliwe okazy pokaż grzyboznawcy (np. w lokalnym sanepidzie).',
          'Nigdy nie jedz surowych grzybów; część gatunków jadalnych jest toksyczna bez obróbki cieplnej.',
          'Nowy gatunek jedz w małej ilości i zachowaj kilka okazów na wypadek badania.',
          'Młode sromotniki wyglądają jak purchawki lub pieczarki — purchawkę zawsze przetnij, a u pieczarki sprawdź blaszki i podstawę trzonu.',
        ],
      },
      {
        t: 'myths',
        items: [
          { myth: 'Srebrna łyżeczka lub cebula ciemnieją przy trujących grzybach.', fact: 'To mit — żadna taka metoda nie wykrywa trucizn.' },
          { myth: 'Robaczywy grzyb jest bezpieczny.', fact: 'Larwy znoszą toksyny, które są groźne dla człowieka.' },
          { myth: 'Jeśli zwierzęta go jedzą, jest jadalny.', fact: 'Ślimaki i wiewiórki jedzą grzyby trujące dla ludzi.' },
          { myth: 'Gotowanie neutralizuje każdą truciznę.', fact: 'Amatoksyny (sromotnik) wytrzymują gotowanie, suszenie i mrożenie.' },
          { myth: 'Trujące grzyby zawsze mają jaskrawe barwy.', fact: 'Sromotnik jest oliwkowy lub biały — wygląda niewinnie.' },
        ],
      },
      { t: 'callout', tone: 'danger', title: 'Podejrzewasz zatrucie?', text: 'Dzwoń na 112 od razu — nie czekaj na objawy, bo przy sromotniku pojawiają się dopiero po 6–24 godzinach. Zachowaj resztki grzybów i potrawy dla lekarza.' },
    ],
  },
  {
    id: 'home',
    icon: 'home-outline',
    title: 'Po powrocie do domu',
    blocks: [
      {
        t: 'list',
        items: [
          'Przejrzyj zbiór jeszcze raz — odrzuć wątpliwe, robaczywe i zniszczone okazy.',
          'Oczyść na sucho nożykiem i szczoteczką; nie moczyć długo.',
          'Przetwórz w ciągu doby (smażenie, gotowanie, suszenie, mrożenie po blanszowaniu); do tego czasu trzymaj w chłodzie.',
          'Opieńki i borowiki ceglastopore obgotuj dokładnie.',
        ],
      },
      { t: 'callout', tone: 'tip', title: 'Zapisz zbiór', text: 'W zakładce Zbiory aplikacja zrobi podsumowanie dnia i zapamięta miejsce znaleziska.' },
      { t: 'cta', label: 'Dodaj zbiór', icon: 'add-circle', target: '/harvest/add' },
    ],
  },
];

export const GUIDE_READ_MIN = 6;
