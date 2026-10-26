import { Completion, snippet } from '@codemirror/autocomplete';

export interface GoSnippetDef {
  label: string;
  detail: string;
  info: string;
  type: 'keyword' | 'function' | 'type' | 'class' | 'variable' | 'constant' | 'namespace';
  template?: string;
  boost?: number;
  pkg?: string;
  keywords?: string[]; // search aliases, e.g. ["print", "println", "fmt"]
}

export const GO_KEYWORDS: GoSnippetDef[] = [
  { label: 'package', detail: 'keyword', info: 'Déclare le package du fichier Go (ex: package main)', type: 'keyword', template: 'package ${1:main}\n\n' },
  { label: 'import', detail: 'keyword', info: 'Importe des packages de la bibliothèque standard ou externes', type: 'keyword', template: 'import (\n\t"${1:fmt}"\n)\n' },
  { label: 'func', detail: 'keyword', info: 'Déclare une fonction ou une méthode avec signature typée', type: 'keyword', template: 'func ${1:name}(${2}) ${3} {\n\t${0}\n}' },
  { label: 'return', detail: 'keyword', info: 'Retourne une ou plusieurs valeurs typées', type: 'keyword', template: 'return ${0}' },
  { label: 'type', detail: 'keyword', info: 'Définit un nouveau type (struct, interface, alias ou type générique)', type: 'keyword', template: 'type ${1:Name} ${2:struct} {\n\t${0}\n}' },
  { label: 'struct', detail: 'keyword', info: 'Structure de données personnalisée contenant des champs typés', type: 'keyword', template: 'struct {\n\t${0}\n}' },
  { label: 'interface', detail: 'keyword', info: 'Ensemble de signatures de méthodes définissant un contrat de comportement', type: 'keyword', template: 'interface {\n\t${0}\n}' },
  { label: 'var', detail: 'keyword', info: 'Déclaration explicite de variable avec valeur zéro par défaut', type: 'keyword', template: 'var ${1:name} ${2:string} = ${3:""}' },
  { label: 'const', detail: 'keyword', info: 'Déclaration d\'une constante immuable évaluée à la compilation', type: 'keyword', template: 'const ${1:Name} = ${2:value}' },
  { label: 'if', detail: 'keyword', info: 'Condition if pouvant inclure une pré-instruction d\'initialisation', type: 'keyword', template: 'if ${1:condition} {\n\t${0}\n}' },
  { label: 'else', detail: 'keyword', info: 'Branche alternative d\'une condition if', type: 'keyword', template: 'else {\n\t${0}\n}' },
  { label: 'switch', detail: 'keyword', info: 'Instruction switch moderne (pas de break requis par cas)', type: 'keyword', template: 'switch ${1:expression} {\ncase ${2:value}:\n\t${0}\ndefault:\n\t\n}' },
  { label: 'case', detail: 'keyword', info: 'Branche de correspondance dans switch ou select', type: 'keyword', template: 'case ${1:value}:\n\t${0}' },
  { label: 'default', detail: 'keyword', info: 'Cas par défaut d\'un switch ou select', type: 'keyword', template: 'default:\n\t${0}' },
  { label: 'for', detail: 'keyword', info: 'Boucle for : boucle unique en Go (conditionnelle, infinie ou par intervalle)', type: 'keyword', template: 'for ${1:i := 0; i < 10; i++} {\n\t${0}\n}' },
  { label: 'range', detail: 'keyword (Go 1.22+)', info: 'Itère sur slice, map, channel ou entier direct (for i := range 10)', type: 'keyword', template: 'range ${0}' },
  { label: 'go', detail: 'keyword', info: 'Démarre une nouvelle goroutine concurrente gérée par le runtime Go', type: 'keyword', template: 'go ${0}' },
  { label: 'select', detail: 'keyword', info: 'Attend sur de multiples opérations de canaux (channels) simultanément', type: 'keyword', template: 'select {\ncase ${1:msg := <-ch}:\n\t${0}\ndefault:\n\t\n}' },
  { label: 'chan', detail: 'keyword', info: 'Canal de communication synchronisé entre goroutines', type: 'keyword', template: 'chan ${0:int}' },
  { label: 'defer', detail: 'keyword', info: 'Retarde l\'exécution d\'un appel jusqu\'à la fin de la fonction parente (LIFO)', type: 'keyword', template: 'defer ${0}' },
  { label: 'map', detail: 'keyword', info: 'Table de hachage associant des clés typées à des valeurs typées', type: 'keyword', template: 'map[${1:string}]${2:int}' },
  { label: 'break', detail: 'keyword', info: 'Interrompt la boucle ou le switch courant', type: 'keyword' },
  { label: 'continue', detail: 'keyword', info: 'Passe immédiatement à l\'itération suivante de la boucle', type: 'keyword' },
  { label: 'fallthrough', detail: 'keyword', info: 'Exécute le bloc case suivant dans un switch sans tester sa condition', type: 'keyword' },
];

export const GO_BUILTIN_TYPES: GoSnippetDef[] = [
  { label: 'any', detail: 'type (Go 1.18+)', info: 'Alias officiel pour interface{} — accepte n\'importe quel type de donnée en Go', type: 'type', boost: 10 },
  { label: 'comparable', detail: 'type (Go 1.18+)', info: 'Contrainte générique pour les types supportant les opérateurs == et !=', type: 'type', boost: 8 },
  { label: 'error', detail: 'type', info: 'Interface standard de gestion des erreurs en Go (méthode Error() string)', type: 'type', boost: 10 },
  { label: 'string', detail: 'type', info: 'Chaîne de caractères UTF-8 immuable en Go', type: 'type' },
  { label: 'bool', detail: 'type', info: 'Type booléen prenant la valeur true ou false', type: 'type' },
  { label: 'int', detail: 'type', info: 'Entier signé (32 bits ou 64 bits selon l\'architecture)', type: 'type' },
  { label: 'int64', detail: 'type', info: 'Entier signé 64 bits', type: 'type' },
  { label: 'int32', detail: 'type', info: 'Entier signé 32 bits (équivalent à rune pour l\'Unicode)', type: 'type' },
  { label: 'uint', detail: 'type', info: 'Entier non-signé (positif uniquement)', type: 'type' },
  { label: 'uint64', detail: 'type', info: 'Entier non-signé 64 bits', type: 'type' },
  { label: 'float64', detail: 'type', info: 'Nombre à virgule flottante 64 bits (standard IEEE-754)', type: 'type' },
  { label: 'float32', detail: 'type', info: 'Nombre flottant 32 bits', type: 'type' },
  { label: 'byte', detail: 'type', info: 'Alias officiel pour uint8 représentant un octet brut', type: 'type' },
  { label: 'rune', detail: 'type', info: 'Alias officiel pour int32 représentant un point de code Unicode UTF-8', type: 'type' },
  { label: 'nil', detail: 'constant', info: 'Valeur zéro pour pointeurs, interfaces, maps, slices, channels et fonctions', type: 'constant', boost: 9 },
  { label: 'true', detail: 'constant', info: 'Constante booléenne vraie', type: 'constant' },
  { label: 'false', detail: 'constant', info: 'Constante booléenne fausse', type: 'constant' },
  { label: 'iota', detail: 'constant', info: 'Générateur séquentiel (0, 1, 2...) pour énumérations dans un bloc const', type: 'constant' },
];

export const GO_BUILTIN_FUNCS: GoSnippetDef[] = [
  // Builtin Print variants
  {
    label: 'println',
    detail: 'builtin: stderr + saut de ligne (sans import)',
    info: `println(args ...Type)
Fonction intégrée (builtin) au runtime Go qui écrit directement sur stderr avec saut de ligne, SANS nécessiter d'importer le package "fmt".
Idéal pour le débogage rapide et le bootstrap sans dépendance.
Pour du code de production propre, préférez fmt.Println() ou log.Println().`,
    type: 'function',
    template: 'println(${0})',
    boost: 14,
    keywords: ['print', 'println', 'stderr', 'debug', 'afficher'],
  },
  {
    label: 'print',
    detail: 'builtin: stderr continu (sans import)',
    info: `print(args ...Type)
Fonction intégrée (builtin) écrivant directement sur stderr sans saut de ligne final et sans nécessiter d'import.
Pour un affichage standard formaté, utilisez fmt.Print() ou fmt.Printf().`,
    type: 'function',
    template: 'print(${0})',
    boost: 13,
    keywords: ['print', 'stderr', 'debug', 'afficher'],
  },
  // Other builtins
  { label: 'make', detail: 'func(t Type, size ...int) Type', info: 'Alloue et initialise slice, map ou channel en mémoire', type: 'function', template: 'make(${1:[]int}, ${2:0})', boost: 10 },
  { label: 'len', detail: 'func(v Type) int', info: 'Retourne la longueur d\'un slice, array, string, map ou channel', type: 'function', template: 'len(${0})', boost: 10 },
  { label: 'cap', detail: 'func(v Type) int', info: 'Retourne la capacité allouée en mémoire à un slice ou channel', type: 'function', template: 'cap(${0})' },
  { label: 'append', detail: 'func(slice []T, elems ...T) []T', info: 'Ajoute des éléments à la fin d\'un slice et retourne le nouveau slice', type: 'function', template: 'append(${1:slice}, ${2:element})', boost: 10 },
  { label: 'new', detail: 'func(Type) *Type', info: 'Alloue de la mémoire zéro pour le type et retourne un pointeur *T', type: 'function', template: 'new(${0})' },
  { label: 'delete', detail: 'func(m map[K]V, key K)', info: 'Supprime une entrée d\'une map par sa clé', type: 'function', template: 'delete(${1:m}, ${2:key})' },
  { label: 'close', detail: 'func(c chan<- Type)', info: 'Ferme un canal pour signaler la fin d\'émission de données', type: 'function', template: 'close(${0:ch})' },
  { label: 'clear', detail: 'func(t Type) (Go 1.21+)', info: 'Réinitialise à zéro tous les éléments d\'un slice ou supprime toutes les entrées d\'une map', type: 'function', template: 'clear(${0:sliceOrMap})', boost: 8 },
  { label: 'min', detail: 'func(x, y ...T) T (Go 1.21+)', info: 'Retourne la plus petite valeur parmi les arguments fournis', type: 'function', template: 'min(${1:a}, ${2:b})', boost: 8 },
  { label: 'max', detail: 'func(x, y ...T) T (Go 1.21+)', info: 'Retourne la plus grande valeur parmi les arguments fournis', type: 'function', template: 'max(${1:a}, ${2:b})', boost: 8 },
  { label: 'panic', detail: 'func(v any)', info: 'Arrête le flot normal de la goroutine courante et déclenche un panic', type: 'function', template: 'panic(${0})' },
  { label: 'recover', detail: 'func() any', info: 'Capture un panic en cours lors d\'une exécution sous defer', type: 'function', template: 'recover()' },
];

/**
 * All Print & Formatting functions across Go standard library
 */
export const PRINT_DECLINATIONS: GoSnippetDef[] = [
  // 1. fmt.Println
  {
    label: 'fmt.Println',
    detail: 'stdout + saut de ligne (\\n)',
    info: `fmt.Println(a ...any) (n int, err error)
Affiche les arguments sur la sortie standard (stdout) en séparant les opérandes par un espace et en terminant par un saut de ligne automatique (\\n).
C'est la fonction d'affichage la plus courante et intuitive en Go.
Exemple : fmt.Println("Résultat :", 42, "succès")`,
    type: 'function',
    template: 'fmt.Println(${0})',
    boost: 25,
    pkg: 'fmt',
    keywords: ['print', 'println', 'fmt', 'afficher', 'stdout', 'console', 'log'],
  },
  // 2. fmt.Printf
  {
    label: 'fmt.Printf',
    detail: 'stdout formaté avec verbes (%v, %d, %s)',
    info: `fmt.Printf(format string, a ...any) (n int, err error)
Affiche sur la sortie standard (stdout) selon un gabarit de formatage strict.
Verbes essentiels :
• %v : valeur brute par défaut
• %+v : champs nommés d'une struct
• %#v : syntaxe littérale Go
• %s : chaîne de caractères (string)
• %d : entier en base 10
• %.2f : flottant avec 2 décimales
• %t : booléen (true ou false)
• %T : type Go de la variable
• %q : chaîne entre guillemets sécurisés
• %p : adresse mémoire (pointeur)
• %w : encapsulation d'erreur (utilisé dans Errorf)
Exemple : fmt.Printf("Utilisateur: %s | Âge: %d\\n", nom, age)`,
    type: 'function',
    template: 'fmt.Printf("${1:%v}\\n", ${2})',
    boost: 24,
    pkg: 'fmt',
    keywords: ['print', 'printf', 'format', 'fmt', 'afficher', 'stdout', 'verbes'],
  },
  // 3. fmt.Print
  {
    label: 'fmt.Print',
    detail: 'stdout continu (sans saut de ligne)',
    info: `fmt.Print(a ...any) (n int, err error)
Affiche les arguments sur la sortie standard (stdout) de manière continue, sans ajouter de saut de ligne final et sans espace automatique entre les chaînes.
Exemple : fmt.Print("Chargement en cours...")`,
    type: 'function',
    template: 'fmt.Print(${0})',
    boost: 23,
    pkg: 'fmt',
    keywords: ['print', 'fmt', 'stdout', 'afficher', 'continu'],
  },
  // 4. fmt.Sprintf
  {
    label: 'fmt.Sprintf',
    detail: 'retourne string formatée (n\'affiche rien)',
    info: `fmt.Sprintf(format string, a ...any) string
Formate selon les verbes (%v, %s, %d...) et RETOURNE la chaîne résultante sous forme de string au lieu de l'afficher sur le terminal.
Indispensable pour construire des messages, des clés, des URLs ou des payloads.
Exemple : url := fmt.Sprintf("https://api.site.com/v1/users/%d", userID)`,
    type: 'function',
    template: 'fmt.Sprintf("${1:%v}", ${2})',
    boost: 22,
    pkg: 'fmt',
    keywords: ['print', 'sprintf', 'string', 'fmt', 'format', 'chaine'],
  },
  // 5. fmt.Sprintln
  {
    label: 'fmt.Sprintln',
    detail: 'retourne string + saut de ligne (\\n)',
    info: `fmt.Sprintln(a ...any) string
Formate les arguments et retourne une chaîne string terminée par un retour à la ligne (\\n). N'affiche rien sur la console.
Exemple : ligne := fmt.Sprintln("Titre", "Sous-titre")`,
    type: 'function',
    template: 'fmt.Sprintln(${0})',
    boost: 21,
    pkg: 'fmt',
    keywords: ['print', 'sprintln', 'string', 'fmt', 'chaine'],
  },
  // 6. fmt.Sprint
  {
    label: 'fmt.Sprint',
    detail: 'retourne string concaténée',
    info: `fmt.Sprint(a ...any) string
Convertit ses opérandes en chaîne et les concatène sans saut de ligne. Retourne une string.
Exemple : texte := fmt.Sprint("Valeur=", 42)`,
    type: 'function',
    template: 'fmt.Sprint(${0})',
    boost: 20,
    pkg: 'fmt',
    keywords: ['print', 'sprint', 'string', 'fmt', 'chaine'],
  },
  // 7. fmt.Fprintf
  {
    label: 'fmt.Fprintf',
    detail: 'écrit formaté dans io.Writer (fichier, HTTP, buffer)',
    info: `fmt.Fprintf(w io.Writer, format string, a ...any) (n int, err error)
Écrit selon le format spécifié directement dans une cible implémentant l'interface io.Writer :
• Un fichier ouvert (os.File)
• Une réponse HTTP (http.ResponseWriter)
• Un buffer en mémoire (bytes.Buffer)
• La sortie d'erreur (os.Stderr)
Exemple : fmt.Fprintf(w, "Bonjour %s\\n", clientNom)`,
    type: 'function',
    template: 'fmt.Fprintf(${1:w}, "${2:%v}\\n", ${3})',
    boost: 19,
    pkg: 'fmt',
    keywords: ['print', 'fprintf', 'writer', 'fmt', 'fichier', 'http'],
  },
  // 8. fmt.Fprintln
  {
    label: 'fmt.Fprintln',
    detail: 'écrit dans io.Writer + saut de ligne (\\n)',
    info: `fmt.Fprintln(w io.Writer, a ...any) (n int, err error)
Écrit les arguments suivis d'un saut de ligne sur le flux de destination io.Writer.
Exemple : fmt.Fprintln(os.Stderr, "Avertissement critique")`,
    type: 'function',
    template: 'fmt.Fprintln(${1:w}, ${2})',
    boost: 18,
    pkg: 'fmt',
    keywords: ['print', 'fprintln', 'writer', 'fmt', 'fichier', 'http'],
  },
  // 9. fmt.Fprint
  {
    label: 'fmt.Fprint',
    detail: 'écrit dans io.Writer sans saut de ligne',
    info: `fmt.Fprint(w io.Writer, a ...any) (n int, err error)
Écrit les arguments bruts sur le flux de destination io.Writer.
Exemple : fmt.Fprint(w, "OK")`,
    type: 'function',
    template: 'fmt.Fprint(${1:w}, ${2})',
    boost: 17,
    pkg: 'fmt',
    keywords: ['print', 'fprint', 'writer', 'fmt', 'fichier', 'http'],
  },
  // 10. fmt.Errorf
  {
    label: 'fmt.Errorf',
    detail: 'crée une error formatée (+ %w wrapping)',
    info: `fmt.Errorf(format string, a ...any) error
Crée et retourne un nouvel objet 'error' formaté.
Grâce au verbe spécial %w, il encapsule (wrap) une erreur parente pour préserver la traçabilité de l'erreur dans l'arbre d'appels (analysable avec errors.Is et errors.As).
Exemple : return fmt.Errorf("échec de connexion à %s: %w", host, err)`,
    type: 'function',
    template: 'fmt.Errorf("${1:erreur}: %w", ${2:err})',
    boost: 22,
    pkg: 'fmt',
    keywords: ['print', 'errorf', 'error', 'fmt', 'wrap', 'err'],
  },
  // 11. log.Println
  {
    label: 'log.Println',
    detail: 'stderr + horodatage automatique (date/heure)',
    info: `log.Println(v ...any)
Écrit sur la sortie d'erreur (stderr) en préfixant automatiquement la date et l'heure courante (ex: 2026/10/26 05:40:12 Démarrage...).
Recommandé pour la journalisation des serveurs et services d'arrière-plan.
Exemple : log.Println("Serveur démarré sur :8080")`,
    type: 'function',
    template: 'log.Println(${0})',
    boost: 19,
    pkg: 'log',
    keywords: ['print', 'println', 'log', 'horodatage', 'journal', 'stderr'],
  },
  // 12. log.Printf
  {
    label: 'log.Printf',
    detail: 'stderr formaté + horodatage automatique',
    info: `log.Printf(format string, v ...any)
Écrit formaté (%v, %s, %d...) sur stderr avec préfixe horodaté automatique au début de la ligne.
Exemple : log.Printf("Connexion acceptée pour l'utilisateur %s (%s)", user, ip)`,
    type: 'function',
    template: 'log.Printf("${1:%v}\\n", ${2})',
    boost: 18,
    pkg: 'log',
    keywords: ['print', 'printf', 'log', 'format', 'horodatage'],
  },
  // 13. log.Print
  {
    label: 'log.Print',
    detail: 'stderr + horodatage standard',
    info: `log.Print(v ...any)
Écrit les arguments sur stderr précédés de l'horodatage standard.
Exemple : log.Print("Opération terminée")`,
    type: 'function',
    template: 'log.Print(${0})',
    boost: 17,
    pkg: 'log',
    keywords: ['print', 'log', 'horodatage'],
  },
  // 14. log.Fatal
  {
    label: 'log.Fatal',
    detail: 'stderr + horodatage puis arrêt immédiat (os.Exit(1))',
    info: `log.Fatal(v ...any)
Écrit le message d'erreur avec date et heure sur stderr, puis appelle immédiatement os.Exit(1) pour stopper l'exécution du programme.
Exemple : if err != nil { log.Fatal("Erreur critique inattendue:", err) }`,
    type: 'function',
    template: 'log.Fatal(${0})',
    boost: 17,
    pkg: 'log',
    keywords: ['print', 'log', 'fatal', 'exit', 'critique'],
  },
  // 15. log.Fatalf
  {
    label: 'log.Fatalf',
    detail: 'stderr formaté + date/heure puis os.Exit(1)',
    info: `log.Fatalf(format string, v ...any)
Écrit formaté avec horodatage puis quitte immédiatement le processus avec code d'erreur 1.
Exemple : log.Fatalf("Impossible d'écouter sur le port %d: %v", port, err)`,
    type: 'function',
    template: 'log.Fatalf("${1:%v}\\n", ${2})',
    boost: 16,
    pkg: 'log',
    keywords: ['print', 'log', 'fatalf', 'exit', 'format'],
  },
  // 16. slog.Info
  {
    label: 'slog.Info',
    detail: 'log structuré moderne Go 1.21+ [INFO]',
    info: `slog.Info(msg string, args ...any)
Journalisation structurée moderne (Go 1.21+ package log/slog) avec attributs clé/valeur au niveau INFO.
Produit des logs structurés (JSON ou texte lisible) faciles à indexer.
Exemple : slog.Info("Requête terminée", "statut", 200, "duree_ms", 15)`,
    type: 'function',
    template: 'slog.Info("${1:message}", "${2:cle}", ${3:valeur})',
    boost: 16,
    pkg: 'log/slog',
    keywords: ['print', 'log', 'slog', 'info', 'structure'],
  },
  // 17. slog.Error
  {
    label: 'slog.Error',
    detail: 'log structuré moderne Go 1.21+ [ERROR]',
    info: `slog.Error(msg string, args ...any)
Journalisation structurée au niveau ERROR avec clé d'erreur explicite.
Exemple : slog.Error("Échec de connexion", "err", err, "tentatives", 3)`,
    type: 'function',
    template: 'slog.Error("${1:erreur}", "err", ${2:err})',
    boost: 15,
    pkg: 'log/slog',
    keywords: ['print', 'log', 'slog', 'error', 'structure'],
  },
];

/**
 * Scan & Input declinations
 */
export const SCAN_DECLINATIONS: GoSnippetDef[] = [
  {
    label: 'fmt.Scanln',
    detail: 'lit sur stdin jusqu\'au saut de ligne',
    info: `fmt.Scanln(a ...any) (n int, err error)
Lit la saisie de l'utilisateur sur stdin et s'arrête au premier saut de ligne (\\n).
Important : Vous devez passer des pointeurs (&variable) pour stocker les valeurs lues !
Exemple : var nom string; fmt.Scanln(&nom)`,
    type: 'function',
    template: 'fmt.Scanln(&${0})',
    boost: 20,
    pkg: 'fmt',
    keywords: ['scan', 'scanln', 'input', 'lire', 'saisie', 'stdin'],
  },
  {
    label: 'fmt.Scanf',
    detail: 'lit sur stdin selon gabarit strict (%s, %d)',
    info: `fmt.Scanf(format string, a ...any) (n int, err error)
Lit les entrées sur stdin en suivant rigoureusement le modèle spécifié.
Exemple : fmt.Scanf("%s %d", &nom, &age)`,
    type: 'function',
    template: 'fmt.Scanf("${1:%v}", &${2})',
    boost: 19,
    pkg: 'fmt',
    keywords: ['scan', 'scanf', 'input', 'saisie', 'stdin'],
  },
  {
    label: 'fmt.Scan',
    detail: 'lit les tokens sur stdin séparés par espaces',
    info: `fmt.Scan(a ...any) (n int, err error)
Lit les prochaines entrées sur stdin en traitant les espaces et retours chariot comme des séparateurs.
Exemple : fmt.Scan(&a, &b)`,
    type: 'function',
    template: 'fmt.Scan(&${0})',
    boost: 18,
    pkg: 'fmt',
    keywords: ['scan', 'input', 'saisie', 'stdin'],
  },
  {
    label: 'fmt.Sscan',
    detail: 'extrait des valeurs depuis une chaîne string',
    info: `fmt.Sscan(str string, a ...any) (n int, err error)
Parse une chaîne string et extrait les valeurs dans les pointeurs passés en argument.
Exemple : fmt.Sscan("Alice 25", &nom, &age)`,
    type: 'function',
    template: 'fmt.Sscan(${1:str}, &${2})',
    boost: 17,
    pkg: 'fmt',
    keywords: ['scan', 'sscan', 'parse', 'string'],
  },
  {
    label: 'fmt.Sscanf',
    detail: 'extrait d\'une string selon formatage typé',
    info: `fmt.Sscanf(str string, format string, a ...any) (n int, err error)
Parse une chaîne string selon un gabarit de formatage strict.
Exemple : fmt.Sscanf("2026-10-26", "%d-%d-%d", &annee, &mois, &jour)`,
    type: 'function',
    template: 'fmt.Sscanf(${1:str}, "${2:%v}", &${3})',
    boost: 16,
    pkg: 'fmt',
    keywords: ['scan', 'sscanf', 'parse', 'string'],
  },
  {
    label: 'fmt.Fscanln',
    detail: 'lit depuis io.Reader (fichier, buffer) jusqu\'au \\n',
    info: `fmt.Fscanln(r io.Reader, a ...any) (n int, err error)
Lit depuis un flux de lecture io.Reader jusqu'au prochain saut de ligne.
Exemple : fmt.Fscanln(fichier, &ligne)`,
    type: 'function',
    template: 'fmt.Fscanln(${1:r}, &${2})',
    boost: 15,
    pkg: 'fmt',
    keywords: ['scan', 'fscanln', 'reader', 'fichier'],
  },
];

/**
 * Standard Library Members for package autocompletion
 */
export const GO_STDLIB_MEMBERS: Record<string, GoSnippetDef[]> = {
  fmt: [
    ...PRINT_DECLINATIONS.filter(p => p.pkg === 'fmt').map(p => ({
      ...p,
      label: p.label.replace('fmt.', ''), // "Println"
      template: p.template?.replace('fmt.', ''), // "Println(${0})"
    })),
    ...SCAN_DECLINATIONS.filter(s => s.pkg === 'fmt').map(s => ({
      ...s,
      label: s.label.replace('fmt.', ''), // "Scanln"
      template: s.template?.replace('fmt.', ''), // "Scanln(&${0})"
    })),
  ],
  slices: [
    {
      label: 'Contains',
      detail: 'func[S ~[]E, E comparable](s S, v E) bool',
      info: `slices.Contains(s, v) vérifie si l'élément v est présent dans le slice s (égalité ==).
Disponibilité : Go 1.21+.
Exemple : slices.Contains([]string{"a", "b"}, "b") // true`,
      type: 'function',
      template: 'Contains(${1:slice}, ${2:val})',
      boost: 15,
      keywords: ['contains', 'slices', 'recherche', 'trouver'],
    },
    {
      label: 'ContainsFunc',
      detail: 'func[S ~[]E, E any](s S, f func(E) bool) bool',
      info: `slices.ContainsFunc(s, f) vérifie si un élément satisfait la fonction prédicat f.
Exemple : slices.ContainsFunc(users, func(u User) bool { return u.Age >= 18 })`,
      type: 'function',
      template: 'ContainsFunc(${1:slice}, func(e) bool { return ${2:false} })',
      boost: 14,
      keywords: ['contains', 'containsfunc', 'slices', 'predicat'],
    },
    {
      label: 'Sort',
      detail: 'func[S ~[]E, E cmp.Ordered](x S)',
      info: `slices.Sort(x) trie les éléments d'un slice en place dans l'ordre croissant naturel.
Disponibilité : Go 1.21+.
Exemple : slices.Sort(nombres)`,
      type: 'function',
      template: 'Sort(${0:slice})',
      boost: 15,
      keywords: ['sort', 'slices', 'trier', 'ordre'],
    },
    {
      label: 'SortFunc',
      detail: 'func[S ~[]E, E any](x S, cmp func(a, b E) int)',
      info: `slices.SortFunc(x, cmp) trie selon une fonction de comparaison personnalisée (retourne <0, 0 ou >0).
Exemple : slices.SortFunc(users, func(a, b User) int { return cmp.Compare(a.Age, b.Age) })`,
      type: 'function',
      template: 'SortFunc(${1:slice}, func(a, b) int { return ${2:cmp.Compare(a, b)} })',
      boost: 14,
      keywords: ['sort', 'sortfunc', 'slices', 'trier'],
    },
    {
      label: 'SortStableFunc',
      detail: 'func[S ~[]E, E any](x S, cmp func(a, b E) int)',
      info: `slices.SortStableFunc(x, cmp) effectue un tri stable préservant l'ordre relatif initial des éléments équivalents.`,
      type: 'function',
      template: 'SortStableFunc(${1:slice}, func(a, b) int { return ${2} })',
      boost: 13,
      keywords: ['sort', 'stable', 'slices'],
    },
    {
      label: 'Index',
      detail: 'func[S ~[]E, E comparable](s S, v E) int',
      info: `slices.Index(s, v) retourne le premier index où v apparaît, ou -1 si non trouvé.
Exemple : idx := slices.Index(fruits, "Pomme")`,
      type: 'function',
      template: 'Index(${1:slice}, ${2:val})',
      boost: 14,
      keywords: ['index', 'slices', 'trouver', 'position'],
    },
    {
      label: 'IndexFunc',
      detail: 'func[S ~[]E, E any](s S, f func(E) bool) int',
      info: `slices.IndexFunc(s, f) retourne le premier index satisfaisant le prédicat f, ou -1.`,
      type: 'function',
      template: 'IndexFunc(${1:slice}, func(e) bool { return ${2} })',
      boost: 13,
      keywords: ['index', 'indexfunc', 'slices'],
    },
    {
      label: 'Clone',
      detail: 'func[S ~[]E, E any](s S) S',
      info: `slices.Clone(s) crée et retourne une copie superficielle (shallow copy) du slice.`,
      type: 'function',
      template: 'Clone(${0:slice})',
      boost: 13,
      keywords: ['clone', 'copy', 'slices'],
    },
    {
      label: 'Concat',
      detail: 'func[S ~[]E, E any](slices ...S) S (Go 1.22+)',
      info: `slices.Concat(...) fusionne plusieurs slices en un seul nouveau slice.
Disponibilité : Go 1.22+.
Exemple : tout := slices.Concat(liste1, liste2, liste3)`,
      type: 'function',
      template: 'Concat(${1:s1}, ${2:s2})',
      boost: 14,
      keywords: ['concat', 'slices', 'fusionner', 'combiner'],
    },
    {
      label: 'Delete',
      detail: 'func[S ~[]E, E any](s S, i, j int) S',
      info: `slices.Delete(s, i, j) supprime la tranche d'éléments d'index s[i:j].`,
      type: 'function',
      template: 'Delete(${1:slice}, ${2:i}, ${3:j})',
      boost: 12,
      keywords: ['delete', 'supprimer', 'slices'],
    },
    {
      label: 'Equal',
      detail: 'func[S ~[]E, E comparable](s1, s2 S) bool',
      info: `slices.Equal(s1, s2) vérifie si deux slices ont la même longueur et des éléments identiques (==).`,
      type: 'function',
      template: 'Equal(${1:s1}, ${2:s2})',
      boost: 13,
      keywords: ['equal', 'slices', 'egalite'],
    },
    {
      label: 'Reverse',
      detail: 'func[S ~[]E, E any](s S)',
      info: `slices.Reverse(s) inverse l'ordre des éléments du slice en place.`,
      type: 'function',
      template: 'Reverse(${0:slice})',
      boost: 13,
      keywords: ['reverse', 'inverser', 'slices'],
    },
    {
      label: 'Max',
      detail: 'func[S ~[]E, E cmp.Ordered](x S) E',
      info: `slices.Max(x) retourne la plus grande valeur contenue dans le slice. Panique si le slice est vide.`,
      type: 'function',
      template: 'Max(${0:slice})',
      boost: 13,
      keywords: ['max', 'slices', 'maximum'],
    },
    {
      label: 'Min',
      detail: 'func[S ~[]E, E cmp.Ordered](x S) E',
      info: `slices.Min(x) retourne la plus petite valeur contenue dans le slice. Panique si le slice est vide.`,
      type: 'function',
      template: 'Min(${0:slice})',
      boost: 13,
      keywords: ['min', 'slices', 'minimum'],
    },
    {
      label: 'All',
      detail: 'func[Slice ~[]E, E any](s Slice) iter.Seq2[int, E] (Go 1.23+)',
      info: `slices.All(s) retourne un itérateur fonctionnel Go 1.23 parcourant tous les couples (index, valeur).
Utilisable directement avec for i, v := range slices.All(slice).`,
      type: 'function',
      template: 'All(${0:slice})',
      boost: 14,
      keywords: ['all', 'iter', 'slices', 'go123'],
    },
    {
      label: 'Backward',
      detail: 'func[Slice ~[]E, E any](s Slice) iter.Seq2[int, E] (Go 1.23+)',
      info: `slices.Backward(s) retourne un itérateur Go 1.23 parcourant le slice de droite à gauche (à l'envers).
Exemple : for i, v := range slices.Backward(slice) { ... }`,
      type: 'function',
      template: 'Backward(${0:slice})',
      boost: 14,
      keywords: ['backward', 'iter', 'slices', 'inverser', 'go123'],
    },
  ],
  maps: [
    {
      label: 'Clone',
      detail: 'func[M ~map[K]V, K comparable, V any](m M) M',
      info: `maps.Clone(m) crée et retourne une copie superficielle de la table de hachage.`,
      type: 'function',
      template: 'Clone(${0:map})',
      boost: 13,
      keywords: ['clone', 'copy', 'maps'],
    },
    {
      label: 'Copy',
      detail: 'func[M1 ~map[K]V, M2 ~map[K]V, K comparable, V any](dst M1, src M2)',
      info: `maps.Copy(dst, src) copie toutes les paires clé/valeur de src vers dst.`,
      type: 'function',
      template: 'Copy(${1:dst}, ${2:src})',
      boost: 12,
      keywords: ['copy', 'maps'],
    },
    {
      label: 'Equal',
      detail: 'func[M1, M2 ~map[K]V, K, V comparable](m1 M1, m2 M2) bool',
      info: `maps.Equal(m1, m2) vérifie si deux maps contiennent les mêmes paires clé/valeur.`,
      type: 'function',
      template: 'Equal(${1:m1}, ${2:m2})',
      boost: 12,
      keywords: ['equal', 'maps', 'egalite'],
    },
    {
      label: 'DeleteFunc',
      detail: 'func[M ~map[K]V, K comparable, V any](m M, del func(K, V) bool)',
      info: `maps.DeleteFunc(m, del) supprime toutes les entrées validées par le prédicat del(k, v).`,
      type: 'function',
      template: 'DeleteFunc(${1:m}, func(k, v) bool { return ${2:false} })',
      boost: 11,
      keywords: ['delete', 'deletefunc', 'maps'],
    },
    {
      label: 'Keys',
      detail: 'func[M ~map[K]V, K comparable, V any](m M) iter.Seq[K] (Go 1.23+)',
      info: `maps.Keys(m) retourne un itérateur Go 1.23 sur toutes les clés de la map.
Exemple : for k := range maps.Keys(m) { ... }`,
      type: 'function',
      template: 'Keys(${0:map})',
      boost: 14,
      keywords: ['keys', 'cles', 'maps', 'iter', 'go123'],
    },
    {
      label: 'Values',
      detail: 'func[M ~map[K]V, K comparable, V any](m M) iter.Seq[V] (Go 1.23+)',
      info: `maps.Values(m) retourne un itérateur Go 1.23 sur toutes les valeurs de la map.
Exemple : for v := range maps.Values(m) { ... }`,
      type: 'function',
      template: 'Values(${0:map})',
      boost: 14,
      keywords: ['values', 'valeurs', 'maps', 'iter', 'go123'],
    },
  ],
  strings: [
    {
      label: 'Contains',
      detail: 'func(s, substr string) bool',
      info: `strings.Contains(s, substr) vérifie si la sous-chaîne substr est contenue dans s.`,
      type: 'function',
      template: 'Contains(${1:s}, "${2:substr}")',
      boost: 15,
      keywords: ['contains', 'strings', 'recherche'],
    },
    {
      label: 'ContainsAny',
      detail: 'func(s, chars string) bool',
      info: `strings.ContainsAny(s, chars) vérifie si au moins un des caractères Unicode de chars est présent dans s.`,
      type: 'function',
      template: 'ContainsAny(${1:s}, "${2:chars}")',
      boost: 13,
      keywords: ['contains', 'containsany', 'strings'],
    },
    {
      label: 'Split',
      detail: 'func(s, sep string) []string',
      info: `strings.Split(s, sep) découpe la chaîne s selon le séparateur sep et retourne un slice de sous-chaînes.
Exemple : tokens := strings.Split("a,b,c", ",")`,
      type: 'function',
      template: 'Split(${1:s}, "${2:,}")',
      boost: 14,
      keywords: ['split', 'decouper', 'strings'],
    },
    {
      label: 'Join',
      detail: 'func(elems []string, sep string) string',
      info: `strings.Join(elems, sep) rassemble tous les éléments d'un slice en une seule chaîne séparée par sep.
Exemple : csv := strings.Join([]string{"a", "b"}, ",")`,
      type: 'function',
      template: 'Join(${1:slice}, "${2:, }")',
      boost: 14,
      keywords: ['join', 'assembler', 'strings'],
    },
    {
      label: 'TrimSpace',
      detail: 'func(s string) string',
      info: `strings.TrimSpace(s) retire tous les espaces blancs, tabulations et retours chariot au début et à la fin.`,
      type: 'function',
      template: 'TrimSpace(${0:s})',
      boost: 14,
      keywords: ['trim', 'trimspace', 'espaces', 'strings'],
    },
    {
      label: 'HasPrefix',
      detail: 'func(s, prefix string) bool',
      info: `strings.HasPrefix(s, prefix) vérifie si la chaîne débute par le préfixe spécifié.`,
      type: 'function',
      template: 'HasPrefix(${1:s}, "${2:prefix}")',
      boost: 13,
      keywords: ['hasprefix', 'prefix', 'strings'],
    },
    {
      label: 'HasSuffix',
      detail: 'func(s, suffix string) bool',
      info: `strings.HasSuffix(s, suffix) vérifie si la chaîne se termine par le suffixe spécifié.`,
      type: 'function',
      template: 'HasSuffix(${1:s}, "${2:suffix}")',
      boost: 13,
      keywords: ['hassuffix', 'suffix', 'strings'],
    },
    {
      label: 'ReplaceAll',
      detail: 'func(s, old, new string) string',
      info: `strings.ReplaceAll(s, old, new) remplace toutes les occurrences de old par new dans la chaîne.`,
      type: 'function',
      template: 'ReplaceAll(${1:s}, "${2:old}", "${3:new}")',
      boost: 13,
      keywords: ['replace', 'replaceall', 'remplacer', 'strings'],
    },
    {
      label: 'ToLower',
      detail: 'func(s string) string',
      info: `strings.ToLower(s) convertit tous les caractères de la chaîne en minuscules Unicode.`,
      type: 'function',
      template: 'ToLower(${0:s})',
      boost: 12,
      keywords: ['tolower', 'minuscule', 'strings'],
    },
    {
      label: 'ToUpper',
      detail: 'func(s string) string',
      info: `strings.ToUpper(s) convertit tous les caractères de la chaîne en majuscules Unicode.`,
      type: 'function',
      template: 'ToUpper(${0:s})',
      boost: 12,
      keywords: ['toupper', 'majuscule', 'strings'],
    },
  ],
  cmp: [
    {
      label: 'Or',
      detail: 'func[T comparable](vals ...T) T (Go 1.22+)',
      info: `cmp.Or(vals...) retourne la première valeur non nulle / non vide parmi vals (valeur de repli concise).
Exemple : user := cmp.Or(inputNom, "Anonyme")`,
      type: 'function',
      template: 'Or(${1:a}, ${2:b})',
      boost: 14,
      keywords: ['or', 'cmp', 'repli', 'default', 'go122'],
    },
    {
      label: 'Compare',
      detail: 'func[T cmp.Ordered](x, y T) int',
      info: `cmp.Compare(x, y) compare deux valeurs ordonnées : -1 si x < y, 0 si x == y, +1 si x > y.`,
      type: 'function',
      template: 'Compare(${1:x}, ${2:y})',
      boost: 13,
      keywords: ['compare', 'cmp', 'comparer'],
    },
  ],
  time: [
    { label: 'Now', detail: 'func() Time', info: 'Retourne l\'instant courant avec la zone horaire locale', type: 'function', template: 'Now()', boost: 14 },
    { label: 'Sleep', detail: 'func(d Duration)', info: 'Suspend l\'exécution de la goroutine pendant la durée spécifiée (ex: time.Sleep(time.Second))', type: 'function', template: 'Sleep(${1:time.Second})', boost: 14 },
    { label: 'Since', detail: 'func(t Time) Duration', info: 'Mesure le temps écoulé depuis l\'instant t (raccourci pour time.Now().Sub(t))', type: 'function', template: 'Since(${0:start})', boost: 13 },
    { label: 'Second', detail: 'const Second Duration = 1000 * Millisecond', info: 'Constante représentant une seconde', type: 'constant' },
    { label: 'Millisecond', detail: 'const Millisecond Duration', info: 'Constante représentant une milliseconde', type: 'constant' },
    { label: 'Minute', detail: 'const Minute Duration = 60 * Second', info: 'Constante représentant une minute', type: 'constant' },
  ],
  context: [
    { label: 'Background', detail: 'func() Context', info: 'Retourne un contexte racine non-nul, jamais annulé, servant de point de départ', type: 'function', template: 'Background()', boost: 14 },
    { label: 'WithTimeout', detail: 'func(parent Context, timeout time.Duration) (Context, CancelFunc)', info: 'Crée un contexte qui expire automatiquement après le délai spécifié', type: 'function', template: 'WithTimeout(${1:ctx}, ${2:5 * time.Second})', boost: 14 },
    { label: 'WithCancel', detail: 'func(parent Context) (ctx Context, cancel CancelFunc)', info: 'Crée un contexte annulable manuellement en appelant cancel()', type: 'function', template: 'WithCancel(${0:ctx})', boost: 13 },
  ],
  json: [
    { label: 'Marshal', detail: 'func(v any) ([]byte, error)', info: 'Sérialise une structure ou map Go en JSON brut ([]byte)', type: 'function', template: 'Marshal(${0:data})', boost: 14 },
    { label: 'Unmarshal', detail: 'func(data []byte, v any) error', info: 'Désérialise du JSON dans un pointeur de structure ou map Go (&dest)', type: 'function', template: 'Unmarshal(${1:bytes}, &${2:target})', boost: 14 },
    { label: 'MarshalIndent', detail: 'func(v any, prefix, indent string) ([]byte, error)', info: 'Sérialise en JSON indenté sur plusieurs lignes lisible pour les humains', type: 'function', template: 'MarshalIndent(${1:data}, "", "  ")', boost: 13 },
  ],
  errors: [
    { label: 'New', detail: 'func(text string) error', info: 'Crée une nouvelle erreur basique avec le message spécifié', type: 'function', template: 'New("${0:message}")', boost: 14 },
    { label: 'Is', detail: 'func(err, target error) bool', info: 'Vérifie si une erreur correspond à la cible dans l\'arbre d\'erreurs encapsulées', type: 'function', template: 'Is(${1:err}, ${2:target})', boost: 13 },
    { label: 'As', detail: 'func(err error, target any) bool', info: 'Extrait une erreur d\'un type spécifique de l\'arbre d\'erreurs wrappées', type: 'function', template: 'As(${1:err}, &${2:target})', boost: 13 },
    { label: 'Join', detail: 'func(errs ...error) error (Go 1.20+)', info: 'Combine plusieurs erreurs simultanées en une seule erreur composite', type: 'function', template: 'Join(${0:err1, err2})', boost: 12 },
  ],
};

/**
 * Builds the complete unified Go completions list
 */
export function buildCompletionsList(): Completion[] {
  const result: Completion[] = [];

  // 1. All Print & Formatting declinations (highest boost for print queries!)
  for (const item of PRINT_DECLINATIONS) {
    result.push({
      label: item.label,
      detail: item.detail,
      info: item.info,
      type: item.type,
      boost: item.boost ?? 20,
      apply: item.template ? snippet(item.template) : item.label,
    });
  }

  // 2. All Scan declinations
  for (const item of SCAN_DECLINATIONS) {
    result.push({
      label: item.label,
      detail: item.detail,
      info: item.info,
      type: item.type,
      boost: item.boost ?? 18,
      apply: item.template ? snippet(item.template) : item.label,
    });
  }

  // 3. Top-level keywords
  for (const item of GO_KEYWORDS) {
    result.push({
      label: item.label,
      detail: item.detail,
      info: item.info,
      type: item.type,
      boost: 10,
      apply: item.template ? snippet(item.template) : item.label,
    });
  }

  // 4. Builtin types
  for (const item of GO_BUILTIN_TYPES) {
    result.push({
      label: item.label,
      detail: item.detail,
      info: item.info,
      type: item.type,
      boost: item.boost ?? 8,
      apply: item.template ? snippet(item.template) : item.label,
    });
  }

  // 5. Builtin functions (make, len, append, println, print, etc.)
  for (const item of GO_BUILTIN_FUNCS) {
    result.push({
      label: item.label,
      detail: item.detail,
      info: item.info,
      type: item.type,
      boost: item.boost ?? 12,
      apply: item.template ? snippet(item.template) : item.label,
    });
  }

  // 6. Stdlib package namespaces & qualified members
  for (const [pkgName, members] of Object.entries(GO_STDLIB_MEMBERS)) {
    result.push({
      label: pkgName,
      detail: `package ${pkgName}`,
      info: `Package officiel Go : ${pkgName}`,
      type: 'namespace',
      boost: 10,
      apply: `${pkgName}.`,
    });

    for (const member of members) {
      const fullLabel = `${pkgName}.${member.label}`;
      // Skip if already in PRINT_DECLINATIONS
      if (PRINT_DECLINATIONS.some(p => p.label === fullLabel)) continue;
      if (SCAN_DECLINATIONS.some(s => s.label === fullLabel)) continue;

      const template = member.template
        ? `${pkgName}.${member.template}`
        : `${fullLabel}()`;

      result.push({
        label: fullLabel,
        detail: member.detail,
        info: member.info,
        type: member.type,
        boost: member.boost ?? 10,
        apply: snippet(template),
      });
    }
  }

  // 7. Type-guided var declarations (e.g. typing "var")
  for (const item of VAR_DECLARATIONS) {
    result.push({
      label: item.label,
      detail: item.detail,
      info: item.info,
      type: item.type,
      boost: item.boost ?? 22,
      apply: item.template ? snippet(item.template) : item.label,
    });
  }

  return result;
}

/**
 * Interactive types list shown immediately when 'var ' is invoked or typed
 */
export const VAR_TYPE_COMPLETIONS: GoSnippetDef[] = [
  {
    label: 'string',
    detail: 'var [nom] string',
    info: `Type : string (Chaîne de caractères UTF-8)
Valeur zéro par défaut : ""
Exemple : var nom string = "Alice"`,
    type: 'type',
    template: '${1:nom} string',
    boost: 30,
    keywords: ['var', 'string', 'chaine'],
  },
  {
    label: 'int',
    detail: 'var [nom] int',
    info: `Type : int (Entier signé standard 32 ou 64 bits)
Valeur zéro par défaut : 0
Exemple : var age int = 25`,
    type: 'type',
    template: '${1:nom} int',
    boost: 29,
    keywords: ['var', 'int', 'entier', 'nombre'],
  },
  {
    label: 'bool',
    detail: 'var [nom] bool',
    info: `Type : bool (Booléen true ou false)
Valeur zéro par défaut : false
Exemple : var estActif bool = true`,
    type: 'type',
    template: '${1:nom} bool',
    boost: 28,
    keywords: ['var', 'bool', 'booleen'],
  },
  {
    label: 'float64',
    detail: 'var [nom] float64',
    info: `Type : float64 (Nombre flottant double précision)
Valeur zéro par défaut : 0.0
Exemple : var prix float64 = 19.99`,
    type: 'type',
    template: '${1:nom} float64',
    boost: 27,
    keywords: ['var', 'float', 'flottant', 'decimal'],
  },
  {
    label: 'any',
    detail: 'var [nom] any',
    info: `Type : any (Accepte n'importe quelle valeur - Go 1.18+)
Valeur zéro par défaut : nil
Exemple : var donnees any = 42`,
    type: 'type',
    template: '${1:nom} any',
    boost: 26,
    keywords: ['var', 'any', 'interface'],
  },
  {
    label: 'error',
    detail: 'var [nom] error',
    info: `Type : error (Interface standard d'erreur en Go)
Valeur zéro par défaut : nil
Exemple : var err error`,
    type: 'type',
    template: '${1:err} error',
    boost: 25,
    keywords: ['var', 'error', 'erreur'],
  },
  {
    label: '[]string',
    detail: 'var [nom] []string',
    info: `Type : []string (Slice dynamique de chaînes)
Valeur zéro par défaut : nil (longueur 0)
Exemple : var prenoms []string`,
    type: 'type',
    template: '${1:liste} []string',
    boost: 24,
    keywords: ['var', 'slice', 'tableau', 'string'],
  },
  {
    label: '[]int',
    detail: 'var [nom] []int',
    info: `Type : []int (Slice dynamique d'entiers)
Valeur zéro par défaut : nil
Exemple : var nombres []int`,
    type: 'type',
    template: '${1:nombres} []int',
    boost: 23,
    keywords: ['var', 'slice', 'tableau', 'int'],
  },
  {
    label: 'map[string]any',
    detail: 'var [nom] map[string]any',
    info: `Type : map[string]any (Table de hachage associative)
Valeur zéro : nil. Doit être initialisée avec make(map[string]any) pour écrire.
Exemple : var config map[string]any`,
    type: 'type',
    template: '${1:config} map[string]any',
    boost: 22,
    keywords: ['var', 'map', 'dictionnaire'],
  },
  {
    label: 'int64',
    detail: 'var [nom] int64',
    info: `Type : int64 (Entier 64 bits de -9223372036854775808 à 9223372036854775807)
Valeur zéro : 0`,
    type: 'type',
    template: '${1:id} int64',
    boost: 21,
    keywords: ['var', 'int64'],
  },
  {
    label: 'byte',
    detail: 'var [nom] byte',
    info: `Type : byte (Alias uint8 représentant 1 octet)
Valeur zéro : 0`,
    type: 'type',
    template: '${1:b} byte',
    boost: 20,
    keywords: ['var', 'byte', 'octet'],
  },
  {
    label: 'time.Time',
    detail: 'var [nom] time.Time',
    info: `Type : time.Time (Instant temporel précis du package standard time)
Valeur zéro : 0001-01-01 00:00:00 UTC`,
    type: 'type',
    template: '${1:date} time.Time',
    boost: 20,
    pkg: 'time',
    keywords: ['var', 'time', 'date'],
  },
  {
    label: 'sync.WaitGroup',
    detail: 'var [nom] sync.WaitGroup',
    info: `Type : sync.WaitGroup (Compteur de synchronisation de goroutines)
Exemple : var wg sync.WaitGroup`,
    type: 'type',
    template: '${1:wg} sync.WaitGroup',
    boost: 19,
    pkg: 'sync',
    keywords: ['var', 'waitgroup', 'sync'],
  },
  {
    label: 'struct',
    detail: 'var [nom] struct { ... }',
    info: `Type : Structure anonyme personnalisée
Exemple : var point struct { X, Y int }`,
    type: 'class',
    template: '${1:donnee} struct {\\n\\t${2:Champ} ${3:string}\\n}',
    boost: 18,
    keywords: ['var', 'struct', 'structure'],
  },
];

/**
 * Direct var declaration snippets when user types "var"
 */
export const VAR_DECLARATIONS: GoSnippetDef[] = [
  {
    label: 'var : string',
    detail: 'var [nom] string',
    info: 'Déclare une variable de type string. Le curseur est positionné sur le nom pour le saisir immédiatement.',
    type: 'keyword',
    template: 'var ${1:nom} string',
    boost: 28,
    keywords: ['var', 'string', 'variable'],
  },
  {
    label: 'var : int',
    detail: 'var [nom] int',
    info: 'Déclare une variable de type entier int. Le curseur est positionné sur le nom pour le saisir immédiatement.',
    type: 'keyword',
    template: 'var ${1:nom} int',
    boost: 27,
    keywords: ['var', 'int', 'entier', 'variable'],
  },
  {
    label: 'var : bool',
    detail: 'var [nom] bool',
    info: 'Déclare une variable booléenne bool. Le curseur est positionné sur le nom.',
    type: 'keyword',
    template: 'var ${1:nom} bool',
    boost: 26,
    keywords: ['var', 'bool', 'variable'],
  },
  {
    label: 'var : float64',
    detail: 'var [nom] float64',
    info: 'Déclare une variable flottante float64. Le curseur est positionné sur le nom.',
    type: 'keyword',
    template: 'var ${1:nom} float64',
    boost: 25,
    keywords: ['var', 'float', 'variable'],
  },
  {
    label: 'var : any',
    detail: 'var [nom] any',
    info: 'Déclare une variable universelle any (Go 1.18+). Le curseur est positionné sur le nom.',
    type: 'keyword',
    template: 'var ${1:nom} any',
    boost: 24,
    keywords: ['var', 'any', 'variable'],
  },
  {
    label: 'var : error',
    detail: 'var [nom] error',
    info: 'Déclare une variable d\'erreur error. Le curseur est positionné sur le nom.',
    type: 'keyword',
    template: 'var ${1:err} error',
    boost: 24,
    keywords: ['var', 'error', 'variable'],
  },
  {
    label: 'var : []string',
    detail: 'var [nom] []string',
    info: 'Déclare un slice de chaînes []string. Le curseur est positionné sur le nom.',
    type: 'keyword',
    template: 'var ${1:liste} []string',
    boost: 23,
    keywords: ['var', 'slice', 'string', 'variable'],
  },
  {
    label: 'var : []int',
    detail: 'var [nom] []int',
    info: 'Déclare un slice d\'entiers []int. Le curseur est positionné sur le nom.',
    type: 'keyword',
    template: 'var ${1:nombres} []int',
    boost: 22,
    keywords: ['var', 'slice', 'int', 'variable'],
  },
  {
    label: 'var : map',
    detail: 'var [nom] map[string]any',
    info: 'Déclare une map associative. Le curseur est positionné sur le nom.',
    type: 'keyword',
    template: 'var ${1:config} map[${2:string}]${3:any}',
    boost: 21,
    keywords: ['var', 'map', 'variable'],
  },
  {
    label: 'var : block (...)',
    detail: 'var ( a string; b int )',
    info: 'Bloc de déclarations de multiples variables.',
    type: 'keyword',
    template: 'var (\n\t${1:nom} ${2:string}\n\t${3:age} ${4:int}\n)',
    boost: 20,
    keywords: ['var', 'bloc', 'multiple'],
  },
];

/**
 * Returns member completions for a specific package after dot typing (e.g. "fmt.")
 */
export function getPackageMembers(pkgName: string): GoSnippetDef[] {
  return GO_STDLIB_MEMBERS[pkgName] || [];
}

