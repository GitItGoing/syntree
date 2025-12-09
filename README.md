This project is a fork of https://github.com/mshang/syntree. The original README and relevant links can be found below.

This fork makes a couple of small changes:

* Brackets can be escaped using a backslash so that they appear in the output image and are not treated as part of the tree structure (this was adopted from [this](https://github.com/mshang/syntree/pull/22) pull request on the original repo).
* Support for non-numeric subscripts, e.g. for indicating traces.
* Feature markers now attach to the current node (the syntactic category label), not to terminal children. Examples: `[DP{•N•} [NP …]]` (features on DP), `[V walked {•D•}]` (features on V, not on "walked"). Markers appear beneath the target node as bracketed items (separate entries with commas, semicolons, literal line breaks, or escaped `\n` sequences inside the braces).
* Surround any label with leading/trailing hyphens (e.g. `-had-` or `[-TP- ...]`) to draw that label with a strikethrough.
* **Triangles**: Add `^` after a node label to draw a triangle to its terminal child instead of a line.
* **Movement lines with labels**: Use `<label:text>` to add a text label displayed below the movement arrow.
* **Affix/dashed lines**: Use `<<label>>` or `<<label:text>>` for dashed arrows (useful for affix hopping, do-support, etc.).

### Syntax Reference

| Feature | Syntax | Description |
|---------|--------|-------------|
| Triangle | `[NP^ the big dog]` | Draws triangle instead of line to terminal |
| Movement (solid) | `<label>` | Tail of movement arrow pointing to `_label` |
| Movement with text | `<label:text>` | Movement arrow with text label below |
| Affix line (dashed) | `<<label>>` | Dashed arrow pointing to `_label` |
| Affix line with text | `<<label:text>>` | Dashed arrow with text label below |
| Head/destination | `_label` | Marks destination node for movement/affix arrows |
| Features | `{[•N•], [+WH]}` | Feature list displayed below node |
| Strikethrough | `-word-` | Draws strikethrough on the text |

### Examples

These strings can be pasted directly into the textarea:

#### Basic Trees
1. `[NP [N Alice] and [N Bob]]`
2. `[S[NP[N Alice]][VP[V is][NP[N'[N a student][PP of physics]]]]]`

#### Triangles
3. `[NP^ Alice]` — triangle from NP to "Alice"
4. `[S [NP^ the big dog] [VP^ ran away]]` — triangles abbreviating internal structure

#### Movement Lines (Solid)
5. `[CP [C_a that] [TP [DP who] [T' [T <a>]]]]` — movement arrow from T to C
6. `[CP [DP_b who] [C' [C ∅] [TP [DP <b>] [T' [T did] [VP see Mary]]]]]` — wh-movement with trace

#### Movement Lines with Labels
7. `[CP [DP_a who] [C' [C ∅] [TP [DP <a:wh-movement>] [VP saw Mary]]]]` — labeled movement arrow
8. `[TP [DP_b she] [T' [T <b:EPP>] [VP [DP <b>] read books]]]` — EPP movement with label

#### Affix Lines (Dashed) — for Affix Hopping
9. `[TP [T_a past] [VP [V walked <<a>>]]]` — affix hopping from V to T
10. `[TP [T_a past] [VP [V walked <<a:Affix Hopping>>]]]` — affix hopping with label

#### Do-Support
11. `[CP [C [T_a Tns] [C ∅ {[+Q]}]] [TP [DP we] [T' [T <<a:do-support>> -Tns-] [NegP [Neg not] [VP [V go]]]]]]` — do-support with dashed arrow

#### Features
12. `[DP{•N•} [NP [N wug]]]` — feature markers on DP
13. `[V promise {[•C•], [•D•]}]` — multiple features on V
14. `[T would {[•v•], \n [+AUX]}]` — features with line break

#### Strikethrough
15. `[V -had-]` — struck-through lexical item
16. `[DP -who- {[+WH]}]` — struck-through with features

#### Complex Example
17. Full tree with movement, affix hopping, and features:
```
[CP
  [C ∅]
  [TP
    [DP She]
    [T'
      [T_a past]
      [VP
        [V met <<a:Affix Hopping>>]
        [DP
          [D the]
          [NP
            [N author]
            [CP
              [DP_b who]
              [C'
                [C ∅]
                [TP
                  [DP <b>]
                  [T'
                    [T_c past]
                    [VP
                      [V wrote <<c:Affix Hopping>>]
                      [DP the book]
                    ]
                  ]
                ]
              ]
            ]
          ]
        ]
      ]
    ]
  ]
]
```
___________________________________________________________

The goal of this project is to create a browser-based, fully local syntax tree generator, for drawing trees as you might find in an introductory linguistics course. Here are a few main features:

* Designed to be easy to use.
* Draws as you type for real-time feedback.
* Basic support for movement arrows using markup.
* Supports Unicode insofar as the browser it is running on does.
* Adjustable appearance.
* Linkable, i.e. parses the query string.

For more details, see the [wiki](https://github.com/mshang/syntree/wiki).

The app can be found at <http://mshang.ca/syntree/>. If you publish a paper with a tree drawn by this app, I would appreciate it if you sent me a link to your paper.

By the way, here are a few great alternatives:

* [phpSyntaxTree](http://ironcreek.net/phpsyntaxtree/)
* [RSyntaxTree](http://www.yohasebe.com/rsyntaxtree/)
