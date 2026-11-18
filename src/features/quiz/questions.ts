export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number; // index in `options`
  explain: string;
}

/** Question pool – each round draws a random subset. */
export const QUESTIONS: QuizQuestion[] = [
  { q: 'Który z tych grzybów jest śmiertelnie trujący?', options: ['Podgrzybek brunatny', 'Muchomor sromotnikowy', 'Maślak zwyczajny', 'Pieprznik jadalny (kurka)'], correct: 1, explain: 'Muchomor sromotnikowy zawiera amatoksyny, które niszczą wątrobę. Nie rozkłada ich gotowanie, suszenie ani mrożenie.' },
  { q: 'Po jakim czasie od zjedzenia sromotnika zwykle pojawiają się pierwsze objawy?', options: ['Po kilku minutach', 'Po 30–60 minutach', 'Po 6–24 godzinach', 'Dopiero po 3 dniach'], correct: 2, explain: 'Opóźnienie to największe niebezpieczeństwo: po 6–24 h pojawiają się wymioty i biegunka, potem następuje pozorna poprawa, choć wątroba jest już uszkadzana.' },
  { q: 'W czym najlepiej nosić grzyby z lasu?', options: ['W foliowej reklamówce', 'W wiklinowym koszu', 'W szczelnym worku', 'W plecaku'], correct: 1, explain: 'Kosz zapewnia przewiew. W foliowej torbie grzyby się parzą i szybko psują.' },
  { q: 'Który sposób pozwala bezpiecznie sprawdzić, czy grzyb jest trujący?', options: ['Srebrna łyżeczka w wywarze', 'Brak robaków w miąższu', 'Zmiana koloru cebuli', 'Żaden — to wszystko mity'], correct: 3, explain: 'Nie istnieje domowy test na trujące grzyby. Łyżeczka, cebula, robaki ani to, że jedzą je zwierzęta, nie dowodzą jadalności.' },
  { q: 'Które cechy są typowe dla muchomora sromotnikowego?', options: ['Białe blaszki, pierścień i bulwa z pochwą u podstawy trzonu', 'Rurki zamiast blaszek, brak pierścienia', 'Żółty, lejkowaty kapelusz', 'Pomarszczony, jamisty kapelusz'], correct: 0, explain: 'Dlatego grzyba trzeba wykopać w całości — pochwa u podstawy trzonu bywa ukryta pod ściółką.' },
  { q: 'Co mają zamiast blaszek borowiki?', options: ['Kolce', 'Fałdy', 'Rurki (gąbkę)', 'Nic — spód jest gładki'], correct: 2, explain: 'Borowiki, podgrzybki, maślaki i koźlarze mają pod kapeluszem rurki, czyli „gąbkę”.' },
  { q: 'W którym miesiącu zaczyna się zwykle sezon na smardze?', options: ['W styczniu', 'W kwietniu', 'W sierpniu', 'W listopadzie'], correct: 1, explain: 'Smardze owocnikują wiosną (kwiecień–maj). Zawsze dokładnie je obgotuj — na surowo są toksyczne.' },
  { q: 'Pod jakim drzewem najczęściej rośnie koźlarz babka?', options: ['Pod sosną', 'Pod brzozą', 'Pod dębem', 'Pod modrzewiem'], correct: 1, explain: 'Koźlarz babka, zwany podbrzeźniakiem, tworzy mikoryzę z brzozami.' },
  { q: 'Co oznacza „grzyb warunkowo jadalny”?', options: ['Jadalny tylko w czerwcu', 'Jadalny po odpowiedniej obróbce, np. dokładnym ugotowaniu', 'Jadalny tylko dla dorosłych', 'Jadalny wyłącznie na surowo'], correct: 1, explain: 'Takie grzyby (np. smardze, opieńki) są bezpieczne dopiero po obróbce cieplnej — na surowo lub niedogotowane szkodzą.' },
  { q: 'Jak prawidłowo wyjąć grzyba z podłoża?', options: ['Wyrwać szarpnięciem', 'Ostrożnie wykręcić lub wysunąć cały owocnik, zachowując podstawę trzonu', 'Ściąć tuż pod kapeluszem', 'Zdeptać, żeby nie rósł więcej'], correct: 1, explain: 'Podstawa trzonu bywa kluczowa do rozpoznania (np. bulwa muchomora). Dołek przykryj ściółką, aby chronić grzybnię.' },
  { q: 'Co zrobić z grzybem, którego nie jesteś pewien?', options: ['Dorzucić do reszty i dobrze ugotować', 'Zjeść mały kawałek na próbę', 'Zostawić w lesie lub pokazać grzyboznawcy', 'Namoczyć w occie'], correct: 2, explain: 'Zasada numer jeden: wątpliwe okazy zostają w lesie albo trafiają do grzyboznawcy (np. w sanepidzie).' },
  { q: 'Co zrobić przy podejrzeniu zatrucia grzybami?', options: ['Poczekać do rana', 'Natychmiast dzwonić pod 112 i zachować resztki grzybów', 'Wypić mleko i położyć się spać', 'Zjeść coś tłustego'], correct: 1, explain: 'Nie czekaj na objawy. Zachowaj resztki grzybów i potrawy — pomogą lekarzom ustalić gatunek.' },
  { q: 'Który grzyb ma żółtopomarańczowy, lejkowaty kapelusz, fałdy zamiast blaszek i pachnie morelą?', options: ['Pieprznik jadalny (kurka)', 'Maślak zwyczajny', 'Borowik szlachetny', 'Muchomor czerwony'], correct: 0, explain: 'Kurka (pieprznik jadalny) ma rozwidlone fałdy zbiegające na trzon i owocowy zapach.' },
  { q: 'Czym jest mikoryza?', options: ['Chorobą grzybów', 'Współżyciem grzybni z korzeniami drzew', 'Rodzajem zarodników', 'Sposobem suszenia grzybów'], correct: 1, explain: 'To symbioza: drzewo dostaje wodę i minerały, grzyb — cukry. Dlatego grzyby rosną przy określonych drzewach.' },
  { q: 'Po czym poznasz czubajkę kanię?', options: ['Ma pręgowany („wężowy”) trzon i ruchomy pierścień', 'Rośnie wyłącznie na drewnie', 'Ma pomarańczowe mleczko', 'Ma rurki zamiast blaszek'], correct: 0, explain: 'Kania to duży „parasol” z ruchomym pierścieniem i pręgowanym trzonem. Zbieraj tylko duże okazy.' },
  { q: 'Ile czasu możesz zwlekać z przetworzeniem grzybów po powrocie z lasu?', options: ['Tydzień', 'Najlepiej do doby — do tego czasu trzymaj w chłodzie', 'Miesiąc', 'Nie ma to znaczenia'], correct: 1, explain: 'Grzyby szybko się psują. Posortuj je, oczyść i przetwórz jak najszybciej.' },
  { q: 'Z jakim drzewem kojarzy się maślak zwyczajny?', options: ['Z sosną', 'Z bukiem', 'Z dębem', 'Z wierzbą'], correct: 0, explain: 'Maślaki rosną w młodych lasach sosnowych, na piaszczystych glebach.' },
  { q: 'Jak sprawdzić, czy kulisty grzyb to jadalna purchawka, a nie młody muchomor?', options: ['Powąchać', 'Przeciąć na pół — purchawka jest w środku jednolicie biała', 'Lekko podgrzać', 'Zważyć'], correct: 1, explain: 'U młodego muchomora po przecięciu widać zarys kapelusza i trzonu. Purchawka jest jednolita i biała.' },
  { q: 'Czym jest hełmówka jadowita?', options: ['Smacznym grzybem do zupy', 'Śmiertelnie trującym grzybem na drewnie, podobnym do opieńki', 'Odmianą borowika', 'Grzybem rosnącym tylko w górach'], correct: 1, explain: 'Zawiera amatoksyny jak sromotnik. Opieńki rosną w dużych kępach i mają białe zarodniki, hełmówka — rdzawe.' },
  { q: 'Na czym rosną opieńki?', options: ['Na drewnie: pniach, korzeniach i martwych drzewach', 'Wyłącznie na łąkach', 'Tylko w mchu pod sosnami', 'Na kamieniach'], correct: 0, explain: 'Opieńki są grzybami drewnożyjącymi — często tworzą duże kępy na pniach.' },
  { q: 'Jesienią w lesie odbywają się polowania zbiorowe. Co warto wtedy mieć na sobie?', options: ['Ubranie w kolorze liści', 'Jaskrawy lub odblaskowy element', 'Barwy maskujące', 'Nic szczególnego'], correct: 1, explain: 'Jaskrawy element sprawia, że jesteś widoczny dla myśliwych i innych osób w lesie.' },
  { q: 'Czy robaczywy grzyb jest bezpieczny?', options: ['Tak, robaki wybierają tylko jadalne', 'Nie — larwy znoszą toksyny groźne dla człowieka', 'Tak, jeśli zjesz go szybko', 'Tak, jeśli go obgotujesz'], correct: 1, explain: 'Obecność robaków nie świadczy o jadalności. Część trucizn nie szkodzi larwom, a człowieka zabija.' },
  { q: 'Który grzyb dawniej uznawano za jadalny, a dziś uważa się za trujący?', options: ['Krowiak podwinięty', 'Maślak zwyczajny', 'Rydz', 'Czubajka kania'], correct: 0, explain: 'Krowiak podwinięty może wywołać groźną reakcję immunologiczną (rozpad krwinek), nawet po ugotowaniu.' },
  { q: 'Co zrobić z opieńką przed zjedzeniem?', options: ['Zjeść na surowo', 'Dokładnie obgotować (min. 15–20 minut) i wylać wywar', 'Tylko lekko podsmażyć', 'Zalać wrzątkiem na minutę'], correct: 1, explain: 'Surowa lub niedogotowana opieńka powoduje zatrucia pokarmowe.' },
  { q: 'Czernidłak kołpakowaty nadaje się do jedzenia, gdy jest…', options: ['Młody, biały i jeszcze zamknięty', 'Już rozpływający się w czarną maź', 'Po tygodniu w lodówce', 'Wysuszony'], correct: 0, explain: 'Po dojrzeniu czernidłak ulega autolizie i rozpływa się w czarną maź — zjadaj go zaraz po zebraniu.' },
  { q: 'Jak najlepiej sfotografować nieznanego grzyba do identyfikacji?', options: ['Tylko kapelusz od góry', 'Z góry, od spodu i z boku — z całą podstawą trzonu', 'Tylko zbliżenie na plamkę', 'Zdjęcie całego kosza'], correct: 1, explain: 'Spód kapelusza (blaszki / rurki), trzon i jego podstawa to cechy, po których odróżnia się sobowtóry.' },
];

export const ROUND_SIZE = 8;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export interface RoundQuestion {
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

/** Random subset of questions with shuffled answers. */
export function newRound(size = ROUND_SIZE): RoundQuestion[] {
  return shuffle(QUESTIONS)
    .slice(0, size)
    .map((q) => {
      const order = shuffle(q.options.map((_, i) => i));
      return { q: q.q, explain: q.explain, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
    });
}
