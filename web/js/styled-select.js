/*
	Styled Select Box
*/
var SSB = SSB || {};

SSB.OptgroupModel = function (optionGroup) {
    this.el = optionGroup;
}

SSB.OptionModel = function () {
    var defaults = {
        disabled : false,
        label : '',
        value : '',
        selected : false
    };
}
/*
    extract options from select element
*/
function _getOptions(selectEl) {

    var options = {};
    options.id = selectEl.id;
    options.multiple= selectEl.multiple;
    options.autofocus = selectEl.autofocus;
    options.required = selectEl.required;
    options.size = selectEl.size;
    options.form = selectEl.form;
    options.disabled = selectEl.disabled;
    options.selectedIndex = selectEl.selectedIndex;
    return options;

};

function _hasOptionGroups(selectEl) {

    var childrenOfSelect = $(selectEl).children();
    return childrenOfSelect[0] ? (childrenOfSelect[0].nodeName === 'OPTGROUP') : false;

}


var SelectModel = function (modelEl){

    var defaults = {
        optionGroups : [],
        options : [],
    };

    this.hasOptionGroups = _hasOptionGroups(modelEl);

    this.config = SSB.utils._extend({}, defaults, _getOptions(modelEl))

    this.$modelEl = $(modelEl);

    this.model = {};

    if(this.hasOptionGroups) {
        this.model.optionGroups = this.$modelEl.children().map(function (index, optionGroup) {
            return new SSB.OptgroupModel(optionGroup);
        });
    } else {
        this.model.options = $("option", this.$modelEl).map(function (index, option) {
            return {
                text : $(option).text(),
                value : $(option).val()
            };
        }).get();
    }
};



$.extend(SelectModel.prototype, {

    getOptionsGroups : function () {

        return this.model.optionGroups;
    },

    getOptions : function () {

        return this.model.options;
    },

    getOptionsLength : function () {

        return $("option", this.$modelEl).length;
    },

    getSelectedIndex : function () {

        var selected =  $(':selected', this.$modelEl).index();
        return selected ? selected : 0;
    },

    getSelectedText : function () {

        return this.model.options[this.getSelectedIndex()].text;
    },

    setSelectedIndex : function (index) {

        this.$modelEl.val($('option', this.$modelEl).eq(index).val());
    },

    // todo : this looks like a leaky abstraction!
    getSelectEl : function () {

        return this.$modelEl;
    },

});


var SelectView = function (model, templateId) {

    this.$template = $(document.getElementById(templateId));

    this.model = model;

    this.render();
}

$.extend(SelectView.prototype, {

    render : function () {


        this.$el = $(this.$template).clone();

        // clean template clone of id attr
        this.$el.attr("id", null);

        this.$optionListItems = this._createListItems();

        this.list = $("[data-role=list]", this.$el);
        this.list.empty();

        this.list.append(this.$optionListItems);

        var select = this.model.getSelectEl();


        this._setSelectedOption();

        this._setDisplayField();

        //  insert view after select box, show it and hide select box
        select.hide();
        this.$el.insertAfter(select);

        this.$el.show();

    },

    toggleHidden : function () {

        this.getOptionsEl().toggleClass('hide');
    },

    hideOptions : function () {

        this.getOptionsEl().addClass('hide');
    },

    updateView : function () {

        this._setDisplayField();
        this._setSelectedOption();
    },

    setActive : function (activeElement) {

        $(activeElement)
            .siblings()
            .removeClass('active')
            .end()
            .addClass('active');
    },

    /* dom methods */

    getDisplayArea : function () {

        return $("[data-role=display-area]", this.$el);
    },

    getArrowButton : function () {

        return $('[data-role=button]', this.$el);
    },

    getOptionsEl : function () {
        return this.list;
    },

    /* private methods */

    _createListItems : function(option, index) {

        var optionTemplate = this._getOptionTemplate();

        var options = this.model.getOptions();

        return $.map(options, $.proxy(function (option) {

            var el = optionTemplate.clone();

            el.text(option.text);
            el.attr("data-value", option.value);

            return el;

        }, this));
    },

    _setSelectedOption : function () {

        $('[data-role=option]', this.list)
            .eq(this.model.getSelectedIndex())
            .addClass('active')
            .siblings()
            .removeClass('active');
    },

    _setDisplayField : function () {

        $("[data-role=display-area]", this.$el).text(this.model.getSelectedText());
    },

    _getOptionTemplate : function () {

        return $("[data-role=option]:first-child", this.$template);
    }

});

var keymap = {

    13 : "return",
    27 : "escape",
    37 : "up",
    38 : "up",
    39 : "down",
    40 : "down"
}

var SelectController = function (model, view) {

    this.model = model;
    this.view = view;

    this.initialize();
};

$.extend(SelectController.prototype, {

    initialize : function () {

        var $optionsEl = this.view.getOptionsEl();

        $optionsEl.on("click", '[data-role=option]', $.proxy(this.optionClick, this));
        $optionsEl.on("mouseover", '[data-role=option]', $.proxy(this.optionHover, this));

        this.view.$el.bind('keyup', $.proxy(this.key, this));

        this.view.$el.bind('blur', $.proxy(this.blur, this));

        this.view.getDisplayArea().bind('click', $.proxy(this.arrowClick, this));
        this.view.getArrowButton().on('click', $.proxy(this.arrowClick, this));

    },

    /*  event handlers */

    // click on an option
    optionClick : function (event) {
        var option = $(event.target);

        this.model.setSelectedIndex(option.index());
        // todo: view should listen to event fired by model
        this._updateView();
        this.view.hideOptions();

    },

    //  hover over option
    optionHover : function (event) {
        this.view.setActive(event.target);
    },

    //
    blur : function () {
        this.view.hideOptions();
    },

    // key event when root element has focus
    key : function (event) {

        switch (keymap[event.which]) {

            case "up" :
                this._decrement();
                break;

            case "down" :
                this._increment();
                break;
            case  "return" :
                this.blur();
                break;
            case "escape" :
                this.blur();
                break;
            default :
                console.log("default")
        }
    },

    arrowClick : function () {

        this.view.toggleHidden();
    },

    // private methods
    _decrement : function () {

        var currentSelected = this.model.getSelectedIndex();

        if(currentSelected-- > 0) {

            this._updateModel(currentSelected);
            this._updateView();
        }

    },

    _increment : function () {
        var currentSelected = this.model.getSelectedIndex();

        if(++currentSelected < this.model.getOptionsLength()) {

            this._updateModel(currentSelected);
            this._updateView();
        }
    },

    _updateModel : function (index) {

        this.model.setSelectedIndex(index);
    },

    _updateView : function () {

        this.view.updateView();
    }

});



//  right way to do it!
function createStyledSelect(element, templateId) {
	var model = new SelectModel(element);
	var view;
	if(model.hasOptionGroups) {
        view = new SSB.SelectWithOptionGroupsView(model);

	} else {
        view = new SelectView(model, templateId);
	}
	var controller = new SelectController(model, view);
}
