// By Miles Shang <mail@mshang.ca>
// MIT license

var debug = true;
var margin = 15; // Number of pixels from tree to edge on each side.
var padding_above_text = 6; // Lines will end this many pixels above text.
var padding_below_text = 6;

function Node() {
	this.value = null;
	this.step = null; // Horizontal distance between children.
	this.draw_triangle = null;
	this.label = null; // Head of movement.
	this.tail = null; // Tail of movement.
	this.tail_text = null; // Text to display on movement line.
	this.max_y = null; // Distance of the descendent of this node that is farthest from root.
	this.children = new Array();
	this.has_children;
	this.first = null;
	this.last = null;
	this.parent = null;
	this.next = null;
	this.previous = null;
	this.x = null; // Where the node will eventually be drawn.
	this.y = null;
	this.head_chain = null;
	this.tail_chain = null;
	this.starred = null;
	this.features = new Array();
	this.feature_block_height = 0;
	this.strikethrough = false;
	this.affix_tail = null; // Tail of affix line (label).
	this.affix_text = null; // Text to display on affix line.
}

var feature_font_delta = 2;
var feature_min_font_size = 6;
var feature_line_gap = 4;
var feature_block_margin = 4;

function getFeatureFontSize(base_size) {
	return Math.max(base_size - feature_font_delta, feature_min_font_size);
}

function getFeatureLineHeight(base_size) {
	return getFeatureFontSize(base_size) + feature_line_gap;
}

function getFeatureBlockHeightFromSize(base_size, feature_count) {
	if ((!feature_count) || (feature_count <= 0)) return 0;
	return feature_block_margin + feature_count * getFeatureLineHeight(base_size);
}

function buildFeatureFont(base_font) {
	var match = base_font.match(/(\d+(?:\.\d+)?)pt/);
	if (!match) return base_font;
	var next_size = Math.max(parseFloat(match[1]) - feature_font_delta, feature_min_font_size);
	return base_font.replace(/(\d+(?:\.\d+)?)pt/, next_size + "pt");
}

function decodeFeatureEscape(ch) {
	switch (ch) {
	case "n": return "\n";
	case "r": return "\r";
	case "t": return "\t";
	case "\\": return "\\";
	default: return ch;
	}
}

function parseStrikethroughMarker(str) {
	if ((!str) || (str.length < 3)) return { text: str, strikethrough: false };
	if ((str[0] != "-") || (str[str.length - 1] != "-")) return { text: str, strikethrough: false };
	var inner = str.substring(1, str.length - 1);
	if (inner.length == 0) return { text: str, strikethrough: false };
	return { text: inner, strikethrough: true };
}

function isWhitespace(ch) {
	return (ch == " ") || (ch == "\t") || (ch == "\n") || (ch == "\r");
}

function splitFeatureList(raw) {
	var list = new Array();
	if (!raw) return list;
	var current = "";
	var esc = false;
	for (var i = 0; i < raw.length; i++) {
		var ch = raw[i];
		if (esc) {
			current = current + ch;
			esc = false;
			continue;
		}
		if (ch == "\\") {
			esc = true;
			continue;
		}
		if ((ch == ",") || (ch == ";") || (ch == "\n") || (ch == "\r")) {
			var trimmed = current.replace(/^\s+|\s+$/g, "");
			if (trimmed.length > 0)
				list.push(trimmed);
			current = "";
			// Skip the paired newline character in Windows-style line endings.
			if ((ch == "\r") && (raw[i+1] == "\n")) i++;
			continue;
		}
		current = current + ch;
	}
	var trimmed = current.replace(/^\s+|\s+$/g, "");
	if (trimmed.length > 0)
		list.push(trimmed);
	return list;
}

function parseFeatureBlock(str, start_index) {
	var buffer = "";
	var esc = false;
	for (var i = start_index + 1; i < str.length; i++) {
		var ch = str[i];
		if (esc) {
			buffer = buffer + decodeFeatureEscape(ch);
			esc = false;
			continue;
		}
		if (ch == "\\") {
			esc = true;
			continue;
		}
		if (ch == "}") {
			return { end: i + 1, features: splitFeatureList(buffer) };
		}
		buffer = buffer + ch;
	}
	return null;
}

function parseTailMarker(str, start_index) {
	if (str[start_index] != "<") return null;
	// Match <label> or <label:text>
	var match = str.substring(start_index).match(/^<(\w+)(?::([^>]*))?>/);
	if (!match) return null;
	return { end: start_index + match[0].length, label: match[1], text: match[2] || null };
}

function parseAffixTailMarker(str, start_index) {
	if (str.substring(start_index, start_index + 2) != "<<") return null;
	// Match <<label>> or <<label:text>>
	var match = str.substring(start_index).match(/^<<(\w+)(?::([^>]*))?>>/);
	if (!match) return null;
	return { end: start_index + match[0].length, label: match[1], text: match[2] || null };
}

function setNodeLabel(raw, node) {
	if ((raw === null) || (raw === undefined)) return;
	// Handle stars on labels.
	raw = raw.replace(/\^/, function() {
		node.starred = true;
		return "";
	});
	// Convert trailing _x into subscripts and store the label.
	raw = raw.replace(/_(\w+)$/, function(match, label) {
		node.label = label;
		if (node.label.search(/^\d+$/) != -1)
			return subscriptify(node.label);
		return "";
	});
	var strike_node = parseStrikethroughMarker(raw);
	node.value = strike_node.text;
	node.strikethrough = strike_node.strikethrough;
}

Node.prototype.set_siblings = function(parent) {
	for (var i = 0; i < this.children.length; i++)
		this.children[i].set_siblings(this);
	
	this.has_children = (this.children.length > 0);
	this.parent = parent;
	
	if (this.has_children) {
		this.first = this.children[0];
		this.last = this.children[this.children.length - 1];
	}
	
	for (var i = 0; i < this.children.length - 1; i++)
		this.children[i].next = this.children[i+1];
	
	for (var i = 1; i < this.children.length; i++)
		this.children[i].previous = this.children[i-1];
}

Node.prototype.check_triangle = function() {
	this.draw_triangle = 0;
	if ((!this.has_children) && (this.parent.starred))
		this.draw_triangle = 1;

	for (var child = this.first; child != null; child = child.next)
		child.check_triangle();
}

Node.prototype.get_feature_width = function(ctx, term_font, nonterm_font) {
	if ((!this.features) || (this.features.length == 0)) return 0;
	var prev_font = ctx.font;
	var base_font = term_font;
	if (this.has_children)
		base_font = nonterm_font;
	var feature_font = buildFeatureFont(base_font);
	ctx.font = feature_font;
	var max_width = 0;
	for (var i = 0; i < this.features.length; i++)
		max_width = Math.max(max_width, ctx.measureText("[" + this.features[i] + "]").width);
	ctx.font = prev_font;
	return max_width;
}

Node.prototype.set_width = function(ctx, vert_space, hor_space, term_font, nonterm_font) {
	ctx.font = term_font;
	if (this.has_children)
		ctx.font = nonterm_font;

	var val_width = ctx.measureText(this.value).width;
	var feature_width = this.get_feature_width(ctx, term_font, nonterm_font);
	val_width = Math.max(val_width, feature_width);

	for (var child = this.first; child != null; child = child.next)
		child.set_width(ctx, vert_space, hor_space, term_font, nonterm_font);
	
	if (!this.has_children) {
		this.left_width = val_width / 2;
		this.right_width = val_width / 2;
		return;
	}
	
	// Figure out how wide apart the children should be placed.
	// The spacing between them should be equal.
	this.step = 0;
	for (var child = this.first; (child != null) && (child.next != null); child = child.next) {
		var space = child.right_width + hor_space + child.next.left_width;
		this.step = Math.max(this.step, space);
	}
	
	this.left_width = 0.0;
	this.right_width = 0.0;
	
	if (this.has_children) {
		var sub = ((this.children.length - 1) / 2) * this.step;
		this.left_width = sub + this.first.left_width;
		this.right_width = sub + this.last.right_width;
	}
	
	this.left_width = Math.max(this.left_width, val_width / 2);
	this.right_width = Math.max(this.right_width, val_width / 2);

}

Node.prototype.find_height = function() {
	this.max_y = this.y + this.feature_block_height;
	for (var child = this.first; child != null; child = child.next)
		this.max_y = Math.max(this.max_y, child.find_height());
	return this.max_y;
}

Node.prototype.assign_location = function(x, y, font_size, term_lines) {
	// floor + 0.5 for antialiasing
	this.x = Math.floor(x) + 0.5;
	this.y = Math.floor(y) + 0.5;
	this.feature_block_height = getFeatureBlockHeightFromSize(font_size, this.features.length);
	
	if (this.has_children) {
		var left_start = x - (this.step)*((this.children.length-1)/2);
		for (var i = 0; i < this.children.length; i++)
			this.children[i].assign_location(left_start + i*(this.step), y + vert_space, font_size, term_lines);
	} else {
		if ((this.parent) && (!term_lines) && (this.parent.children.length == 1) && (!this.draw_triangle))
			this.y = this.parent.y + this.parent.feature_block_height + padding_above_text + padding_below_text + font_size;
	}
}

Node.prototype.draw = function(ctx, font_size, term_font, nonterm_font, color, term_lines) {
	ctx.font = term_font;
	if (this.has_children)
		ctx.font = nonterm_font;
		
	ctx.fillStyle = "black";
	if (color) {
		ctx.fillStyle = "green";
		if (this.has_children)
			ctx.fillStyle = "blue";
	}
	
	var base_string = this.value;
	var subscript = "";
	const delimiter = ":("
	if (this.value.includes(delimiter)) {
		const value_parsed = this.value.split(delimiter);
		base_string = value_parsed[0];
		subscript = value_parsed[1];
		if (subscript.includes(")")) {
			subscript = subscript.split(")")[0];
		}
	}
	
	var base_width = ctx.measureText(base_string).width;
	ctx.fillText(base_string, this.x, this.y);
	this.draw_strikethrough(ctx, base_width, font_size);

	if (subscript != "") {
		const font_parsed = this.has_children ? nonterm_font.split(" ") : term_font.split(" ");
		subscript_font_size = font_size - 3.25;
		subscript_font = subscript_font_size.toString() + "pt " + font_parsed[1];
		ctx.font = subscript_font;
		ctx.fillText(subscript, this.x + font_size / 1.6, this.y + subscript_font_size / 2.75);
	}

	this.draw_features(ctx, font_size, term_font, nonterm_font);

	for (var child = this.first; child != null; child = child.next)
		child.draw(ctx, font_size, term_font, nonterm_font, color, term_lines);
	
	if (!this.parent) return;
	
	var parent_bottom = this.parent.y + this.parent.feature_block_height + padding_below_text;
	
	if (this.draw_triangle) {
		ctx.moveTo(this.parent.x, parent_bottom);
		ctx.lineTo(this.x - this.left_width, this.y - font_size - padding_above_text);
		ctx.lineTo(this.x + this.right_width, this.y - font_size - padding_above_text);
		ctx.lineTo(this.parent.x, parent_bottom);
		ctx.stroke();
		return;
	}
	
	if ((!this.has_children) && (!term_lines) && (this.parent.children.length == 1)) return;
	
	ctx.moveTo(this.parent.x, parent_bottom);
	ctx.lineTo(this.x, this.y - font_size - padding_above_text);
	ctx.stroke();
}

Node.prototype.draw_features = function(ctx, font_size, term_font, nonterm_font) {
	if ((!this.features) || (this.features.length == 0)) return;
	var base_font = term_font;
	if (this.has_children)
		base_font = nonterm_font;
	var prev_font = ctx.font;
	var feature_font = buildFeatureFont(base_font);
	ctx.font = feature_font;
	var line_height = getFeatureLineHeight(font_size);
	var start_y = this.y + feature_block_margin + getFeatureFontSize(font_size);
	for (var i = 0; i < this.features.length; i++)
		ctx.fillText("[" + this.features[i] + "]", this.x, start_y + i * line_height);
	ctx.font = prev_font;
}

Node.prototype.draw_strikethrough = function(ctx, text_width, font_size) {
	if ((!this.strikethrough) || (text_width <= 0)) return;
	var prev_stroke = ctx.strokeStyle;
	var prev_line_width = ctx.lineWidth;
	ctx.strokeStyle = ctx.fillStyle;
	ctx.lineWidth = Math.max(1, font_size / 12);
	var half = text_width / 2;
	var line_y = this.y - font_size * 0.3;
	ctx.beginPath();
	ctx.moveTo(this.x - half, line_y);
	ctx.lineTo(this.x + half, line_y);
	ctx.stroke();
	ctx.strokeStyle = prev_stroke;
	ctx.lineWidth = prev_line_width;
}

Node.prototype.find_head = function(label) {
	for (var child = this.first; child != null; child = child.next) {
		var res = child.find_head(label);
		if (res != null) return res;
	}
	
	if (this.label == label) return this;
	return null;
}

Node.prototype.find_movement = function(mlarr, root) {
	for (var child = this.first; child != null; child = child.next)
		child.find_movement(mlarr, root);
	
	if (this.tail != null) {
		var m = new MovementLine;
		m.tail = this;
		m.head = root.find_head(this.tail);
		m.text = this.tail_text;
		mlarr.push(m);
	}
}

Node.prototype.reset_chains = function() {
	this.head_chain = null;
	this.tail_chain = null;
	
	for (var child = this.first; child != null; child = child.next)
		child.reset_chains();
}

Node.prototype.find_intervening_height = function(leftwards) {
	var max_y = this.y + this.feature_block_height;
	
	var n = this;
	while (true) {
		if (leftwards) {n = n.previous;} else {n = n.next;}
		if (!n) break;
		if ((n.head_chain) || (n.tail_chain)) return max_y;
		max_y = Math.max(max_y, n.max_y);
	}
	
	if (this.parent) {
		max_y = Math.max(max_y,
			this.parent.find_intervening_height(leftwards));
	}
	return max_y;
}

function MovementLine() {
	this.head = null;
	this.tail = null;
	this.text = null; // Optional label text for the line.
	this.lca = null;
	this.dest_x = null;
	this.dest_y = null;
	this.bottom_y = null;
	this.max_y = null;
	this.should_draw = null;
	this.leftwards = null;
}

MovementLine.prototype.set_up = function() {
	this.should_draw = 0;
	if ((this.tail == null) || (this.head == null)) return;
	
	// Check to see if head is parent of tail,
	if (!this.check_head()) return;
	
	// Find the last common ancestor.
	this.find_lca();
	if (this.lca == null) return;
	
	// Find out the greatest intervening height.
	this.find_intervening_height();
	
	this.dest_x = this.head.x;
	this.dest_y = this.head.max_y;
	this.bottom_y = this.max_y + vert_space;
	this.should_draw = 1;
	return;
}

MovementLine.prototype.check_head = function() {
	var n = this.tail;
	n.tail_chain = 1;
	while (n.parent != null) {
		n = n.parent;
		if (n == this.head) return 0;
		n.tail_chain = 1;
	}
	return 1;
}

MovementLine.prototype.find_lca = function() {
	var n = this.head;
	n.head_chain = 1;
	this.lca = null;
	while (n.parent != null) {
		n = n.parent;
		n.head_chain = 1;
		if (n.tail_chain) {
			this.lca = n;
			break;
		}
	}
}

MovementLine.prototype.find_intervening_height = function() {
	for (var child = this.lca.first; child != null; child = child.next) {
		if ((child.head_chain) || (child.tail_chain)) {
			this.leftwards = false;
			if (child.head_chain) this.leftwards = true;
			break;
		}
	}
	
	this.max_y = Math.max(this.tail.find_intervening_height( this.leftwards), 
	                      this.head.find_intervening_height(!this.leftwards),
						  this.head.max_y);
}

MovementLine.prototype.draw = function(ctx, font_size) {
	var tail_x = this.tail.x + 3;
	var head_x = this.dest_x - 3;
	if (this.leftwards) {
		tail_x -= 6;
		head_x += 6;
	}

	var tail_start_y = this.tail.max_y + padding_below_text;
	ctx.moveTo(tail_x, tail_start_y);
	ctx.quadraticCurveTo(tail_x, this.bottom_y, (tail_x + head_x) / 2, this.bottom_y);
	ctx.quadraticCurveTo(head_x, this.bottom_y, head_x, this.dest_y + padding_below_text);
	ctx.stroke();
	// Arrowhead
	ctx.beginPath();
	ctx.lineTo(head_x + 3, this.dest_y + padding_below_text + 10);
	ctx.lineTo(head_x - 3, this.dest_y + padding_below_text + 10);
	ctx.lineTo(head_x, this.dest_y + padding_below_text);
	ctx.closePath();
	ctx.fillStyle = "#000000";
	ctx.fill();

	// Draw text label if present
	if (this.text) {
		var mid_x = (tail_x + head_x) / 2;
		var text_y = this.bottom_y + font_size + 2;
		ctx.font = (font_size - 2) + "pt sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(this.text, mid_x, text_y);
	}
}

function AffixLine() {
	this.head = null;
	this.tail = null;
	this.text = null; // Optional label text for the line.
	this.lca = null;
	this.dest_x = null;
	this.dest_y = null;
	this.bottom_y = null;
	this.max_y = null;
	this.should_draw = null;
	this.leftwards = null;
}

AffixLine.prototype.set_up = function() {
	this.should_draw = 0;
	if ((this.tail == null) || (this.head == null)) return;

	// Check to see if head is parent of tail.
	if (!this.check_head()) return;

	// Find the last common ancestor.
	this.find_lca();
	if (this.lca == null) return;

	// Find out the greatest intervening height.
	this.find_intervening_height();

	this.dest_x = this.head.x;
	this.dest_y = this.head.max_y;
	this.bottom_y = this.max_y + vert_space;
	this.should_draw = 1;
	return;
}

AffixLine.prototype.check_head = function() {
	var n = this.tail;
	n.tail_chain = 1;
	while (n.parent != null) {
		n = n.parent;
		if (n == this.head) return 0;
		n.tail_chain = 1;
	}
	return 1;
}

AffixLine.prototype.find_lca = function() {
	var n = this.head;
	n.head_chain = 1;
	this.lca = null;
	while (n.parent != null) {
		n = n.parent;
		n.head_chain = 1;
		if (n.tail_chain) {
			this.lca = n;
			break;
		}
	}
}

AffixLine.prototype.find_intervening_height = function() {
	for (var child = this.lca.first; child != null; child = child.next) {
		if ((child.head_chain) || (child.tail_chain)) {
			this.leftwards = false;
			if (child.head_chain) this.leftwards = true;
			break;
		}
	}

	this.max_y = Math.max(this.tail.find_intervening_height( this.leftwards),
	                      this.head.find_intervening_height(!this.leftwards),
						  this.head.max_y);
}

AffixLine.prototype.draw = function(ctx, font_size) {
	var tail_x = this.tail.x + 3;
	var head_x = this.dest_x - 3;
	if (this.leftwards) {
		tail_x -= 6;
		head_x += 6;
	}

	// Save context state
	ctx.save();

	// Set dashed line style
	ctx.setLineDash([5, 3]);

	var tail_start_y = this.tail.max_y + padding_below_text;
	ctx.beginPath();
	ctx.moveTo(tail_x, tail_start_y);
	ctx.quadraticCurveTo(tail_x, this.bottom_y, (tail_x + head_x) / 2, this.bottom_y);
	ctx.quadraticCurveTo(head_x, this.bottom_y, head_x, this.dest_y + padding_below_text);
	ctx.stroke();

	// Restore solid line for arrowhead
	ctx.setLineDash([]);

	// Arrowhead
	ctx.beginPath();
	ctx.lineTo(head_x + 3, this.dest_y + padding_below_text + 10);
	ctx.lineTo(head_x - 3, this.dest_y + padding_below_text + 10);
	ctx.lineTo(head_x, this.dest_y + padding_below_text);
	ctx.closePath();
	ctx.fillStyle = "#000000";
	ctx.fill();

	// Draw text label if present
	if (this.text) {
		var mid_x = (tail_x + head_x) / 2;
		var text_y = this.bottom_y + font_size + 2;
		ctx.font = (font_size - 2) + "pt sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(this.text, mid_x, text_y);
	}

	// Restore context state
	ctx.restore();
}

Node.prototype.find_affix_lines = function(alarr, root) {
	for (var child = this.first; child != null; child = child.next)
		child.find_affix_lines(alarr, root);

	if (this.affix_tail != null) {
		var a = new AffixLine();
		a.tail = this;
		a.head = root.find_head(this.affix_tail);
		a.text = this.affix_text;
		alarr.push(a);
	}
}

function go(str, font_size, term_font, nonterm_font, vert_space, hor_space, color, term_lines) {	
	// Clean up the string
	str = str.replace(/^\s+/, "");
	var open = 0;
    var esc = false;
	for (var i = 0; i < str.length; i++) {
		if (!esc) {
            if (str[i] == "[") open++;
            else if (str[i] == "]") open--;
            else if (str[i] == "\\") esc = true;
        }
        esc = false;
	}
	while (open < 0) {
		str = "[" + str;
		open++;
	}
	while (open > 0) {
		str = str + "]";
		open--;
	}
	
	var root = parse(str);
	root.set_siblings(null);
	root.check_triangle();
	
	var canvas;
	var ctx;
	
	try {
		// Make a new canvas. Required for IE compatability.
		canvas = document.createElement("canvas");
		ctx = canvas.getContext('2d');
	} catch (err) {
		throw "canvas";
	}

	// Find out dimensions of the tree.
	root.set_width(ctx, vert_space, hor_space, term_font, nonterm_font);
	root.assign_location(0, 0, font_size, term_lines);
	root.find_height();
	
	var movement_lines = new Array();
	root.find_movement(movement_lines, root);
	for (var i = 0; i < movement_lines.length; i++) {
		root.reset_chains();
		movement_lines[i].set_up();
	}

	var affix_lines = new Array();
	root.find_affix_lines(affix_lines, root);
	for (var i = 0; i < affix_lines.length; i++) {
		root.reset_chains();
		affix_lines[i].set_up();
	}

	// Set up the canvas.
	var width = root.left_width + root.right_width + 2 * margin;
	var height = root.max_y + font_size + 2 * margin;
	// Problem: movement/affix lines may protrude from bottom.
	for (var i = 0; i < movement_lines.length; i++)
		if (movement_lines[i].max_y == root.max_y) {
			height += vert_space; break;
		}
	for (var i = 0; i < affix_lines.length; i++)
		if (affix_lines[i].max_y == root.max_y) {
			height += vert_space; break;
		}
	
	canvas.id = "canvas";
	canvas.width = width;
	canvas.height = height;
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.textAlign = "center";
	var x_shift = Math.floor(root.left_width + margin);
	var y_shift = Math.floor(font_size + margin);
	ctx.translate(x_shift, y_shift);
	
	root.draw(ctx, font_size, term_font, nonterm_font, color, term_lines);
	for (var i = 0; i < movement_lines.length; i++)
		if (movement_lines[i].should_draw) movement_lines[i].draw(ctx, font_size);
	for (var i = 0; i < affix_lines.length; i++)
		if (affix_lines[i].should_draw) affix_lines[i].draw(ctx, font_size);

	// Swap out the image
	return Canvas2Image.saveAsPNG(canvas, true);
}

function subscriptify(in_str) {
	var out_str = "";
	for (var i = 0; i < in_str.length; ++i) {
		switch (in_str[i]) {
		case "0": out_str = out_str + "₀"; break;
		case "1": out_str = out_str + "₁"; break;
		case "2": out_str = out_str + "₂"; break;
		case "3": out_str = out_str + "₃"; break;
		case "4": out_str = out_str + "₄"; break;
		case "5": out_str = out_str + "₅"; break;
		case "6": out_str = out_str + "₆"; break;
		case "7": out_str = out_str + "₇"; break;
		case "8": out_str = out_str + "₈"; break;
		case "9": out_str = out_str + "₉"; break;
		}
	}
	return out_str;
}

function parse(str) {
	var n = new Node();
	
	if (str[0] != "[") { // Text node
		// Get any movement information.
		// Make sure to collapse any spaces around <X> to one space, even if there is no space.	
		str = str.replace(/\s*<(\w+)>\s*/, 
			function(match, tail) {
				n.tail = tail;
				return " ";
	        })
            .replace(/^\s+/, "")
		    .replace(/\s+$/, "")
            .replace(/\\([\[\]])/g, "$1");     
		var strike_term = parseStrikethroughMarker(str);
		n.value = strike_term.text;
		n.strikethrough = strike_term.strikethrough;
		return n;
	}

	// Remove the outer brackets so we can scan the node contents.
	var body = str.substring(1, str.length - 1);
	var i = 0;
	var esc = false;
	var token_start = null;

	function flushTextToken(end_index) {
		if (token_start === null) return;
		var raw = body.substring(token_start, end_index).replace(/^\s+|\s+$/g, "");
		if (raw.length > 0) {
			if (n.value === null) {
				setNodeLabel(raw, n);
			} else {
				var child = parse(raw);
				n.children.push(child);
			}
		}
		token_start = null;
	}

	while (i < body.length) {
		var ch = body[i];
		if (esc) {
			esc = false; i++; continue;
		}
		if (ch == "\\") {
			esc = true; i++; continue;
		}
		if (isWhitespace(ch)) { flushTextToken(i); i++; continue; }

		if (ch == "{") {
			flushTextToken(i);
			var feature_data = parseFeatureBlock(body, i);
			if (feature_data != null) {
				// Always attach features to the current node (the category label),
				// not to the last parsed child (terminal word)
				n.features = n.features.concat(feature_data.features);
				i = feature_data.end;
				continue;
			}
			if (token_start === null) token_start = i;
			i++;
			continue;
		}

		if (ch == "<") {
			flushTextToken(i);
			// Try affix tail marker first (<<label>> or <<label:text>>)
			var affix_data = parseAffixTailMarker(body, i);
			if (affix_data != null) {
				n.affix_tail = affix_data.label;
				n.affix_text = affix_data.text;
				i = affix_data.end;
				continue;
			}
			// Then try regular movement tail marker (<label> or <label:text>)
			var tail_data = parseTailMarker(body, i);
			if (tail_data != null) {
				n.tail = tail_data.label;
				n.tail_text = tail_data.text;
				i = tail_data.end;
				continue;
			}
			if (token_start === null) token_start = i;
			i++;
			continue;
		}

		if (ch == "[") {
			flushTextToken(i);
			var depth = 1;
			var child_start = i;
			i++;
			var child_esc = false;
			for (; i < body.length; i++) {
				var c2 = body[i];
				if (child_esc) { child_esc = false; continue; }
				if (c2 == "\\") { child_esc = true; continue; }
				if (c2 == "[") depth++;
				else if (c2 == "]") {
					depth--;
					if (depth == 0) break;
				}
			}
				if (depth == 0) {
					var child_str = body.substring(child_start, i + 1);
					var child = parse(child_str);
					n.children.push(child);
					last_target = child;
					i++;
					continue;
				}
			// Unmatched bracket, treat as text.
			if (token_start === null) token_start = child_start;
			continue;
		}

		if (token_start === null) token_start = i;
		i++;
	}
	flushTextToken(i);

	if (n.value === null) n.value = "";
	return n;
}
