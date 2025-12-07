This project is a fork of https://github.com/mshang/syntree. The original README and relevant links can be found below.

This fork makes a couple of small changes:

* Brackets can be escaped using a backslash so that they appear in the output image and are not treated as part of the tree structure (this was adopted from [this](https://github.com/mshang/syntree/pull/22) pull request on the original repo).
* Support for non-numeric subscripts, e.g. for indicating traces.
* Feature markers can be attached to any node by placing them in curly braces anywhere inside that node's brackets (before/after the label, children, or movement tags). For example, `[DP{•N•} [NP …]]`, `[{•N•} DP [NP …]]`, or `[DP [NP …] {•N•}]` all work. The markers appear beneath the node as bracketed items (separate entries with commas, semicolons, literal line breaks, or escaped `\n` sequences inside the braces).
* Surround any label with leading/trailing hyphens (e.g. `-had-` or `[-TP- ...]`) to draw that label with a strikethrough.

### Examples

These strings can be pasted directly into the textarea (they mirror the in-app Help section):

1. `[NP^ Alice]`
2. `[NP [N Alice] and [N Bob]]`
3. `[S[NP[N Alice]][VP[V is][NP[N'[N a student][PP^ of physics]]]]]`
4. `[S [X_a Movement] [Y example <a>]]`
5. `[DP{•N•} [NP [N wug]]]` (feature markers stacked under a DP)
6. `[T' [T_c [Aux had]] [T <c> [Aux_b had] [T Tns]]]` (movement arrow from the lower `T` to the head labeled `c`)
7. `[V -had-]` (struck-through lexical item)
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
