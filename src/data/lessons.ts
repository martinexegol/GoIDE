import { GoLesson } from '../types';

export const GO_LESSONS: GoLesson[] = [
  {
    id: '01-hello-world',
    title: '01. Les Fondations & Affichage',
    level: 'Débutant',
    summary: 'Structure minimale d\'un programme Go, package main et package standard fmt.',
    explanation: `En Go, tout code appartient à un package. Un programme exécutable doit impérativement déclarer le package 'main' et contenir une fonction 'main()'. Le package 'fmt' fait partie de la bibliothèque standard et permet d'écrire sur la sortie standard (stdout).`,
    keyConcepts: [
      'package main : point d\'entrée exécutable',
      'import "fmt" : imports de la bibliothèque standard',
      'func main() : première fonction appelée',
      'fmt.Println() : saut de ligne automatique',
      'fmt.Printf() : formatage typé (%v, %s, %d)',
    ],
    code: `package main

import (
\t"fmt"
)

func main() {
\t// Affichage simple avec saut de ligne
\tfmt.Println("🚀 Bienvenue dans Go !")

\t// Formatage avec verbes de formatage
\tlang := "Go"
\tversion := "1.23"
\tfmt.Printf("Langage : %s | Version : %s\\n", lang, version)

\t// Affichage d'un type avec %T
\tfmt.Printf("Le type de la version est : %T\\n", version)
}
`,
  },
  {
    id: '02-variables-and-types',
    title: '02. Variables, Inférence & Iota',
    level: 'Débutant',
    summary: 'Déclaration courte :=, typage statique fort, constantes et générateur iota.',
    explanation: `Go est un langage statiquement et fortement typé avec inférence de type. L'opérateur court ':=' est utilisé à l'intérieur des fonctions pour déclarer et initialiser en une seule ligne. 'iota' permet de créer facilement des énumérations auto-incrémentées.`,
    keyConcepts: [
      ':= opérateur court de déclaration + assignation',
      'var pour déclarations avec valeur zéro par défaut',
      'Types primitifs : int, float64, string, bool',
      'const et iota pour les énumérations',
      'Pas de conversion implicite de type en Go',
    ],
    code: `package main

import (
\t"fmt"
)

// Énumération avec iota
const (
\tStatutEnAttente = iota // 0
\tStatutEnCours          // 1
\tStatutTermine          // 2
)

func main() {
\t// Déclaration courte avec inférence de type (courante en Go)
\tnom := "Alice"
\tage := 28
\testActif := true
\tpoids := 68.5

\t// Déclaration explicite avec valeur zéro
\tvar compteur int // vaut 0 par défaut

\tfmt.Printf("Utilisateur : %s (Âge: %d, Actif: %t, Poids: %.1f kg)\\n", nom, age, estActif, poids)
\tfmt.Printf("Compteur initialisé à zéro : %d\\n", compteur)

\t// Test de l'énumération iota
\tfmt.Println("Statuts iota :")
\tfmt.Printf("En attente = %d, En cours = %d, Terminé = %d\\n", StatutEnAttente, StatutEnCours, StatutTermine)
}
`,
  },
  {
    id: '03-modern-loops-go122',
    title: '03. Boucles Modernes (Go 1.22+)',
    level: 'Go 1.22+',
    summary: 'La nouvelle syntaxe de boucle range sur un entier et itération sur slices.',
    explanation: `Go n'a qu'un seul mot-clé de boucle : 'for' ! Depuis Go 1.22, vous pouvez enfin écrire 'for i := range 10' directement pour boucler de 0 à 9 sans la syntaxe verbeuse C-style. De plus, les variables de boucle sont désormais proprement scopées par itération.`,
    keyConcepts: [
      'for i := range N : range directement sur les entiers (Go 1.22+)',
      'for idx, val := range slice : parcours index/valeur',
      'for condition { ... } : équivalent du while d\'autres langages',
      'for { ... } : boucle infinie avec break conditionnel',
    ],
    code: `package main

import (
\t"fmt"
)

func main() {
\t// NOUVEAUTÉ Go 1.22+ : Range directement sur un entier !
\tfmt.Println("--- Boucle range sur entier (Go 1.22+) ---")
\tfor i := range 5 {
\t\tfmt.Printf("Étape %d\\n", i)
\t}

\t// Parcours d'un slice avec range
\tfmt.Println("\\n--- Parcours d'un slice ---")
\tlangages := []string{"Go", "Rust", "TypeScript", "Zig"}
\tfor index, lang := range langages {
\t\tfmt.Printf("[%d] %s\\n", index, lang)
\t}

\t// Boucle conditionnelle (style while)
\tfmt.Println("\\n--- Boucle conditionnelle ---")
\tn := 3
\tfor n > 0 {
\t\tfmt.Printf("Compte à rebours : %d...\\n", n)
\t\tn--
\t}
\tfmt.Println("Décollage !")
}
`,
  },
  {
    id: '04-functions-and-errors',
    title: '04. Fonctions & Gestion d\'Erreur',
    level: 'Intermédiaire',
    summary: 'Retours multiples, gestion explicite des erreurs (if err != nil) et wrapping.',
    explanation: `Go ne possède pas de système d'exceptions (try/catch). Les erreurs sont des valeurs de type 'error' retournées explicitement comme dernière valeur d'une fonction. Le motif 'if err != nil' est le cœur du code Go idiomatique et robuste.`,
    keyConcepts: [
      'Retours multiples : (resultat, error)',
      'Motif fondamental : if err != nil',
      'errors.New et fmt.Errorf pour créer des erreurs',
      'Le verbe %w pour wrapper une erreur (Go 1.13+)',
      'Pas d\'exceptions cachées : flux limpide et prévisible',
    ],
    code: `package main

import (
\t"errors"
\t"fmt"
)

// Fonction avec retours multiples : un résultat float64 et une error
func Diviser(a, b float64) (float64, error) {
\tif b == 0 {
\t\treturn 0, errors.New("division par zéro impossible")
\t}
\treturn a / b, nil
}

// Fonction démontrant le wrapping d'erreur avec fmt.Errorf et %w
func CalculerMoyenne(total, effectif float64) (float64, error) {
\tres, err := Diviser(total, effectif)
\tif err != nil {
\t\treturn 0, fmt.Errorf("échec du calcul de la moyenne: %w", err)
\t}
\treturn res, nil
}

func main() {
\t// Cas 1 : Division valide
\tres1, err1 := CalculerMoyenne(150, 10)
\tif err1 != nil {
\t\tfmt.Println("Erreur :", err1)
\t} else {
\t\tfmt.Printf("Moyenne 1 = %.2f\\n", res1)
\t}

\t// Cas 2 : Division par zéro
\tres2, err2 := CalculerMoyenne(100, 0)
\tif err2 != nil {
\t\tfmt.Printf("Erreur capturée avec succès : %v\\n", err2)
\t} else {
\t\tfmt.Printf("Résultat : %.2f\\n", res2)
\t}
}
`,
  },
  {
    id: '05-structs-and-methods',
    title: '05. Structures, Méthodes & Pointeurs',
    level: 'Intermédiaire',
    summary: 'Structs avec tags, composition sans héritage, récepteurs valeur vs pointeur *T.',
    explanation: `Go remplace les classes traditionnelles par des 'struct' et des méthodes attachées. Un récepteur par pointeur '*T' permet de modifier la structure en place sans la copier en mémoire, ce qui est crucial pour les performances et la cohérence de l'état.`,
    keyConcepts: [
      'type Name struct { ... } : définition d\'objets',
      'Tags de struct pour la métadonnée (ex: json:"name")',
      'func (s *Struct) Method() : récepteur par pointeur',
      'Composition : imbrication de structs sans héritage',
    ],
    code: `package main

import (
\t"fmt"
)

// Définition d'une structure CompteBancaire
type CompteBancaire struct {
\tTitulaire string
\tSolde     float64
}

// Méthode avec récepteur par valeur (lecture seule, ne modifie pas le compte original)
func (c CompteBancaire) Afficher() {
\tfmt.Printf("Compte de %s | Solde actuel : %.2f €\\n", c.Titulaire, c.Solde)
}

// Méthode avec récepteur par pointeur (*CompteBancaire) pour modifier l'état en place
func (c *CompteBancaire) Deposer(montant float64) {
\tif montant > 0 {
\t\tc.Solde += montant
\t\tfmt.Printf("-> Dépôt de %.2f € effectué.\\n", montant)
\t}
}

func (c *CompteBancaire) Retirer(montant float64) bool {
\tif montant > c.Solde {
\t\tfmt.Printf("-> Retrait de %.2f € refusé (solde insuffisant).\\n", montant)
\t\treturn false
\t}
\tc.Solde -= montant
\tfmt.Printf("-> Retrait de %.2f € effectué.\\n", montant)
\treturn true
}

func main() {
\t// Initialisation du compte
\tcompte := CompteBancaire{
\t\tTitulaire: "Jean Dupont",
\t\tSolde:     500.0,
\t}

\tcompte.Afficher()
\tcompte.Deposer(250.50)
\tcompte.Retirer(100.0)
\tcompte.Retirer(800.0)
\tcompte.Afficher()
}
`,
  },
  {
    id: '06-generics-modern-go',
    title: '06. Génériques Modernes [T any]',
    level: 'Avancé',
    summary: 'Fonctions et types génériques avec contraintes de type (any, comparable).',
    explanation: `Depuis Go 1.18, Go intègre les génériques de façon très lisible via la syntaxe [T any] ou [T comparable]. Cela permet d'écrire des algorithmes et structures de données réutilisables sans perdre la sécurité du typage ni payer le coût de l'interface{} vide.`,
    keyConcepts: [
      '[T any] : paramètre de type acceptant tout type',
      '[T comparable] : types supportant == et !=',
      'cmp.Ordered : types ordonnés (<, <=, >, >=)',
      'Fonctions d\'ordre supérieur : Map, Filter, Reduce',
    ],
    code: `package main

import (
\t"fmt"
)

// Fonction générique pour filtrer n'importe quel slice selon un prédicat
func Filtrer[T any](liste []T, predicat func(T) bool) []T {
\tvar resultat []T
\tfor _, item := range liste {
\t\tif predicat(item) {
\t\t\tresultat = append(resultat, item)
\t\t}
\t}
\treturn resultat
}

// Fonction générique pour trouver l'index d'un élément (contrainte comparable)
func TrouverIndex[T comparable](liste []T, cible T) int {
\tfor idx, val := range liste {
\t\tif val == cible {
\t\t\treturn idx
\t\t}
\t}
\treturn -1
}

func main() {
\t// Exemple 1 : Filtrer des nombres entiers pairs
\tnombres := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
\tpairs := Filtrer(nombres, func(n int) bool {
\t\treturn n%2 == 0
\t})
\tfmt.Println("Nombres pairs filtrés :", pairs)

\t// Exemple 2 : Filtrer des chaînes
\tmots := []string{"Go", "Python", "Rust", "Gopher", "JavaScript"}
\tlongsMots := Filtrer(mots, func(m string) bool {
\t\treturn len(m) > 4
\t})
\tfmt.Println("Mots de plus de 4 lettres :", longsMots)

\t// Exemple 3 : Recherche générique
\tindexGopher := TrouverIndex(mots, "Gopher")
\tfmt.Printf("L'élément 'Gopher' est à l'index : %d\\n", indexGopher)
}
`,
  },
  {
    id: '07-concurrency-channels',
    title: '07. Goroutines & Canaux (Channels)',
    level: 'Avancé',
    summary: 'Modèle CSP de Go : lancez des milliers de threads légers et synchronisez par canaux.',
    explanation: `Le célèbre adage de Go dit : "Ne communiquez pas en partageant la mémoire, partagez la mémoire en communiquant". Les goroutines sont des threads ultra-légers (quelques kilo-octets) gérés par le runtime Go. Les canaux (channels) permettent d'échanger des données en toute sécurité.`,
    keyConcepts: [
      'go func() : lancement asynchrone non-bloquant',
      'ch := make(chan T) : création de canal typé',
      'ch <- valeur : envoi dans le canal',
      'valeur := <-ch : réception bloquante',
      'sync.WaitGroup : attente élégante de fin de tâches',
    ],
    code: `package main

import (
\t"fmt"
\t"sync"
\t"time"
)

// Fonction exécutée concurremment dans une goroutine
func travailleur(id int, canalResultat chan<- string, wg *sync.WaitGroup) {
\tdefer wg.Done() // Décrémente le compteur de goroutines à la sortie

\tfmt.Printf("[Worker #%d] Début du calcul...\\n", id)
\ttime.Sleep(time.Duration(id*100) * time.Millisecond) // simulation de traitement
\t
\t// Envoi de la réponse sur le canal
\tcanalResultat <- fmt.Sprintf("Résultat calculé par le Worker #%d", id)
}

func main() {
\tconst nbWorkers = 4
\tvar wg sync.WaitGroup
\tcanal := make(chan string, nbWorkers)

\t// Démarrage des goroutines concurrentes
\tfor i := 1; i <= nbWorkers; i++ {
\t\twg.Add(1)
\t\tgo travailleur(i, canal, &wg)
\t}

\t// Goroutine séparée pour fermer le canal une fois tout terminé
\tgo func() {
\t\twg.Wait()
\t\tclose(canal)
\t}()

\t// Lecture des résultats au fur et à mesure de leur arrivée
\tfmt.Println("--- Réception des résultats en direct ---")
\tfor msg := range canal {
\t\tfmt.Println("-> Reçu :", msg)
\t}

\tfmt.Println("Toutes les goroutines ont terminé avec succès !")
}
`,
  },
  {
    id: '08-modern-slices-maps',
    title: '08. Slices & Maps Modernes (Go 1.21+)',
    level: 'Go 1.22+',
    summary: 'Les packages standard slices et maps qui ont révolutionné la manipulation des collections.',
    explanation: `Avant Go 1.21, chaque développeur devait réécrire ses propres fonctions pour trier, chercher ou cloner des slices et maps. Les nouveaux packages standard 'slices' et 'maps' fournissent des fonctions optimisées et prêtes à l'emploi.`,
    keyConcepts: [
      'slices.Contains() : vérifie la présence d\'un élément',
      'slices.Sort() : tri en place optimisé',
      'slices.Clone() : duplication rapide',
      'maps.Keys() & maps.Values() : extraction de clés/valeurs',
      'clear() : vider un slice ou une map en une ligne',
    ],
    code: `package main

import (
\t"fmt"
\t"slices"
)

func main() {
\tnombres := []int{42, 10, 88, 3, 27}
\tfmt.Println("Slice d'origine :", nombres)

\t// 1. Recherche avec slices.Contains
\texiste := slices.Contains(nombres, 88)
\tfmt.Printf("Est-ce que 88 est présent ? %t\\n", existe)

\t// 2. Clone et tri
\tcopieTrier := slices.Clone(nombres)
\tslices.Sort(copieTrier)
\tfmt.Println("Slice trié :", copieTrier)

\t// 3. Min et Max (Go 1.21+)
\tplusPetit := slices.Min(nombres)
\tplusGrand := slices.Max(nombres)
\tfmt.Printf("Min: %d | Max: %d\\n", plusPetit, plusGrand)

\t// 4. Fonction clear() intégrée
\tclear(copieTrier)
\tfmt.Println("Slice après clear() :", copieTrier)
}
`,
  },
  {
    id: '09-iterators-go123',
    title: '09. Nouveaux Itérateurs de Go 1.23 (iter.Seq)',
    level: 'Go 1.23+',
    summary: 'Créer des itérateurs personnalisés utilisables nativement avec la boucle for range.',
    explanation: `Go 1.23 introduit le support natif des fonctions d'itération ('iter.Seq' et 'iter.Seq2'). Une fonction qui retourne 'iter.Seq[T]' peut être parcourue directement dans une boucle 'for v := range iterator' !`,
    keyConcepts: [
      'iter.Seq[T] : itérateur à une valeur (func(yield func(T) bool))',
      'iter.Seq2[K, V] : itérateur à deux valeurs (clé, valeur)',
      'yield(val) : transmet la valeur à la boucle for',
      'slices.All() et slices.Backward() de Go 1.23',
    ],
    code: `package main

import (
\t"fmt"
\t"iter"
\t"slices"
)

// Définition d'un itérateur Go 1.23 générant des nombres pairs jusqu'à un maximum
func NombresPairs(max int) iter.Seq[int] {
\treturn func(yield func(int) bool) {
\t\tfor i := 0; i <= max; i += 2 {
\t\t\t// yield retourne false si la boucle 'for' s'interrompt avec break
\t\t\tif !yield(i) {
\t\t\t\treturn
\t\t\t}
\t\t}
\t}
}

func main() {
\tfmt.Println("--- Itérateur personnalisé Go 1.23 ---")
\tfor n := range NombresPairs(10) {
\t\tfmt.Printf("Nombre pair : %d\\n", n)
\t}

\tfmt.Println("\\n--- Parcours inversé avec slices.Backward (Go 1.23) ---")
\tfruits := []string{"Pomme", "Banane", "Mangue", "Orange"}
\tfor index, fruit := range slices.Backward(fruits) {
\t\tfmt.Printf("[%d] %s\\n", index, fruit)
\t}
}
`,
  },
  {
    id: '10-http-and-json',
    title: '10. API Web, HTTP & Sérialisation JSON',
    level: 'Avancé',
    summary: 'Routage moderne net/http de Go 1.22+ avec méthodes HTTP et encodage JSON.',
    explanation: `Go est réputé pour sa bibliothèque standard capable de faire tourner des microservices de production sans aucun framework lourd ! En Go 1.22+, http.ServeMux supporte nativement la méthode HTTP et le path matching (ex: "GET /api/users").`,
    keyConcepts: [
      'ServeMux moderne Go 1.22+ ("GET /chemin")',
      'json.Marshal et json.Unmarshal',
      'Tags struct \`json:"clé"\`',
      'Structures pour requêtes et réponses d\'API',
    ],
    code: `package main

import (
\t"encoding/json"
\t"fmt"
\t"time"
)

// Structure avec tags JSON pour le mapping automatique
type Article struct {
\tID        int       \`json:"id"\`
\tTitre     string    \`json:"titre"\`
\tPrix      float64   \`json:"prix"\`
\tDisponible bool      \`json:"disponible"\`
\tDateAjout time.Time \`json:"date_ajout"\`
}

func main() {
\tarticleOriginal := Article{
\t\tID:         101,
\t\tTitre:      "Guide Ultime de Go 1.23",
\t\tPrix:       29.99,
\t\tDisponible: true,
\t\tDateAjout:  time.Now(),
\t}

\t// 1. Sérialisation Go -> JSON
\tjsonData, err := json.MarshalIndent(articleOriginal, "", "  ")
\tif err != nil {
\t\tfmt.Println("Erreur sérialisation :", err)
\t\treturn
\t}
\tfmt.Println("JSON généré :")
\tfmt.Println(string(jsonData))

\t// 2. Désérialisation JSON -> Go Struct
\tjsonBrut := \`{"id": 102, "titre": "Programmation Système", "prix": 39.50, "disponible": false}\`
\tvar nouvelArticle Article
\tif err := json.Unmarshal([]byte(jsonBrut), &nouvelArticle); err != nil {
\t\tfmt.Println("Erreur parsing :", err)
\t\treturn
\t}

\tfmt.Printf("\\nArticle désérialisé : %s (Prix: %.2f €)\\n", nouvelArticle.Titre, nouvelArticle.Prix)
}
`,
  },
];
