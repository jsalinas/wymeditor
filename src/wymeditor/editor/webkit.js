/*jslint evil: true */
/*
 * WYMeditor : what you see is What You Mean web-based editor
 * Copyright (c) 2005 - 2009 Jean-Francois Hovinne, http://www.wymeditor.org/
 * Dual licensed under the MIT (MIT-license.txt)
 * and GPL (GPL-license.txt) licenses.
 *
 * For further information visit:
 *        http://www.wymeditor.org/
 *
 * File Name:
 *        jquery.wymeditor.safari.js
 *        Safari specific class and functions.
 *        See the documentation for more info.
 *
 * File Authors:
 *        Jean-Francois Hovinne (jf.hovinne a-t wymeditor dotorg)
 *        Scott Lewis (lewiscot a-t gmail dotcom)
 */

WYMeditor.WymClassSafari = function (wym) {
    this._wym = wym;
    this._class = "class";
};

WYMeditor.WymClassSafari.prototype.initIframe = function (iframe) {
    var wym = this,
        styles,
        aCss;

    this._iframe = iframe;
    this._doc = iframe.contentDocument;

    //add css rules from options
    styles = this._doc.styleSheets[0];
    aCss = eval(this._options.editorStyles);

    this.addCssRules(this._doc, aCss);

    this._doc.title = this._wym._index;

    //set the text direction
    jQuery('html', this._doc).attr('dir', this._options.direction);

    //init designMode
    this._doc.designMode = "on";

    //init html value
    this.html(this._wym._html);

    //pre-bind functions
    if (jQuery.isFunction(this._options.preBind)) {
        this._options.preBind(this);
    }

    //bind external events
    this._wym.bindEvents();

    //bind editor keydown events
    jQuery(this._doc).bind("keydown", this.keydown);

    //bind editor keyup events
    jQuery(this._doc).bind("keyup", this.keyup);

    //post-init functions
    if (jQuery.isFunction(this._options.postInit)) {
        this._options.postInit(this);
    }

    //add event listeners to doc elements, e.g. images
    this.listen();
};

WYMeditor.WymClassSafari.prototype._exec = function (cmd, param) {
    if (!this.selected()) {
        return false;
    }

    var focusNode = this.selected(),
        _param, container, attr;

    // DIV insert detection (causes problems)
    if (cmd.toLowerCase() == WYMeditor.INSERT_HTML.toLowerCase()) {
        _param = jQuery(param);

        if (_param.is('div')) {
            attr = _param.get(0).attributes;
            // replace default block with DIV
            this._doc.execCommand(WYMeditor.FORMAT_BLOCK, '', WYMeditor.DIV);
            // copy attributes
            container = this.selected();
            for (var i = 0; i < attr.length; i++) {
                container.setAttribute(attr[i].name, attr[i].value);
            }

            param = _param.html();
        }
    }

    if (param) {
        this._doc.execCommand(cmd, '', param);
    } else {
        this._doc.execCommand(cmd, '', null);
    }

    // Wrap this content in a paragraph tag if we're in the body
    container = this.selected();
    if (container && container.tagName.toLowerCase() === WYMeditor.BODY) {
        this._exec(WYMeditor.FORMAT_BLOCK, WYMeditor.P);
    }

    return true;
};

WYMeditor.WymClassSafari.prototype.addCssRule = function (styles, oCss) {
    styles.insertRule(oCss.name + " {" + oCss.css + "}",
        styles.cssRules.length);
};


//keydown handler, mainly used for keyboard shortcuts
WYMeditor.WymClassSafari.prototype.keydown = function (e) {
    //'this' is the doc
    var wym = WYMeditor.INSTANCES[this.title];

    if (e.ctrlKey) {
        if (e.keyCode === WYMeditor.KEY.B) {
            //CTRL+b => STRONG
            wym._exec(WYMeditor.BOLD);
            e.preventDefault();
        }
        if (e.keyCode === WYMeditor.KEY.I) {
            //CTRL+i => EMPHASIS
            wym._exec(WYMeditor.ITALIC);
            e.preventDefault();
        }
    } else if (e.shiftKey && e.keyCode === WYMeditor.KEY.ENTER) {
        // Safari 4 and earlier would show a proper linebreak in the editor and
        // then strip it upon save with the default action in the case of inserting
        // a new line after bold text
        wym._exec('InsertLineBreak');
        e.preventDefault();
    }
};

// Keyup handler, mainly used for cleanups
WYMeditor.WymClassSafari.prototype.keyup = function (evt) {
    //'this' is the doc
    var wym = WYMeditor.INSTANCES[this.title],
        container,
        name;

    wym._selected_image = null;

    // Fix to allow shift + return to insert a line break in older safari
    if (jQuery.browser.version < 534.1) {
        // Not needed in AT MAX chrome 6.0. Probably safe earlier
        if (evt.keyCode === WYMeditor.KEY.ENTER && evt.shiftKey) {
            wym._exec('InsertLineBreak');
        }
    }

    if (evt.keyCode !== WYMeditor.KEY.BACKSPACE &&
            evt.keyCode !== WYMeditor.KEY.CTRL &&
            evt.keyCode !== WYMeditor.KEY.DELETE &&
            evt.keyCode !== WYMeditor.KEY.COMMAND &&
            evt.keyCode !== WYMeditor.KEY.UP &&
            evt.keyCode !== WYMeditor.KEY.DOWN &&
            evt.keyCode !== WYMeditor.KEY.LEFT &&
            evt.keyCode !== WYMeditor.KEY.RIGHT &&
            evt.keyCode !== WYMeditor.KEY.ENTER &&
            !evt.metaKey &&
            !evt.ctrlKey) {// Not BACKSPACE, DELETE, CTRL, or COMMAND key

        container = wym.selected();
        name = container.tagName.toLowerCase();

        // Fix forbidden main containers
        if (name === "strong" ||
                name === "b" ||
                name === "em" ||
                name === "i" ||
                name === "sub" ||
                name === "sup" ||
                name === "a" ||
                name === "span") {
            // Webkit tries to use spans as a main container

            name = container.parentNode.tagName.toLowerCase();
        }

        if (name === WYMeditor.BODY) {
            // Replace text nodes with <p> tags
            wym._exec(WYMeditor.FORMAT_BLOCK, WYMeditor.P);
            wym.fixBodyHtml();
        }
    }

    // If we potentially created a new block level element or moved to a new one
    // then we should ensure that they're in the proper format
    if (evt.keyCode === WYMeditor.KEY.UP ||
            evt.keyCode === WYMeditor.KEY.DOWN ||
            evt.keyCode === WYMeditor.KEY.LEFT ||
            evt.keyCode === WYMeditor.KEY.RIGHT ||
            evt.keyCode === WYMeditor.KEY.BACKSPACE ||
            evt.keyCode === WYMeditor.KEY.ENTER) {
        wym.fixBodyHtml();
    }
};

WYMeditor.WymClassSafari.prototype.openBlockTag = function (tag, attributes) {
    var new_tag;

    attributes = this.validator.getValidTagAttributes(tag, attributes);

    // Handle Safari styled spans
    if (tag === 'span' && attributes.style) {
        new_tag = this.getTagForStyle(attributes.style);
        if (new_tag) {
            tag = new_tag;
            this._tag_stack.pop();
            this._tag_stack.push(tag);
            attributes.style = '';

            // Should fix #125 - also removed the xhtml() override
            if (typeof attributes['class'] === 'string') {
                attributes['class'] = attributes['class'].replace(
                    /apple-style-span/gi,
                    ''
                );
            }
        }
    }

    this.output += this.helper.tag(tag, attributes, true);
};

WYMeditor.WymClassSafari.prototype.getTagForStyle = function (style) {
    if (/bold/.test(style)) {
        return 'strong';
    } else if (/italic/.test(style)) {
        return 'em';
    } else if (/sub/.test(style)) {
        return 'sub';
    } else if (/super/.test(style)) {
        return 'sup';
    }

    return false;
};
