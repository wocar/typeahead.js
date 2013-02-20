describe('InputView', function() {
  var fixture = [
        '<input class="tt-search-input tt-query" type="text" autocomplete="false" spellcheck="false">',
        '<input class="tt-search-input tt-hint" type="text" autocomplete="false" spellcheck="false" disabled>'
      ].join('\n'),
     KEY_MAP = {
      enter: 13,
      esc: 27,
      tab: 9,
      left: 37,
      right: 39,
      up: 38,
      down: 40,
      normal: 65 // "A" key
    };

  beforeEach(function() {
    var $fixtures;

    setFixtures(fixture);

    $fixtures = $('#jasmine-fixtures');
    this.$input = $fixtures.find('.tt-query');
    this.$hint = $fixtures.find('.tt-hint');

    this.inputView = new InputView({ input: this.$input, hint: this.$hint });
  });

  describe('when input gains focus', function() {
    beforeEach(function() {
      spyOnEvent(this.$input, 'focus');
      this.$input.blur().focus();
    });

    it('should trigger focus', function() {
      expect('focus').toHaveBeenTriggeredOn(this.$input);
    });
  });

  describe('when query loses focus', function() {
    beforeEach(function() {
      spyOnEvent(this.$input, 'blur');
      this.$input.focus().blur();
    });

    it('should trigger blur', function() {
      expect('blur').toHaveBeenTriggeredOn(this.$input);
    });
  });

  describe('when keydown', function() {
    var keys = ['esc', 'tab', 'left', 'right', 'up', 'down', 'enter'];

    beforeEach(function() {
      var that = this;

      this.spies = {};

      keys.forEach(function(key) {
        that.inputView.on(key, that.spies[key] = jasmine.createSpy());
      });
    });

    // DRY principle in practice
    keys.forEach(function(key) {
      describe('if ' + key, function() {
        beforeEach(function() {
          simulateKeyEvent(this.$input, 'keydown', KEY_MAP[key]);
        });

        it('should trigger ' + key, function() {
          expect(this.spies[key]).toHaveBeenCalled();
        });
      });
    });
  });

  describe('when input', function() {
    beforeEach(function() {
      this.inputView.on('queryChange', this.qcSpy = jasmine.createSpy());
      this.inputView.on('whitespaceChange', this.wcSpy = jasmine.createSpy());
    });

    describe('if query changed', function() {
      beforeEach(function() {
        this.inputView.query = 'old';
        this.inputView.$input.val('new');

        simulateKeyEvent(this.$input, 'input', KEY_MAP.NORMAL);
      });

      it('should trigger queryChange', function() {
        expect(this.qcSpy).toHaveBeenCalled();
      });

      it('should not trigger whitespaceChange', function() {
        expect(this.wcSpy).not.toHaveBeenCalled();
      });

      it('should update internal query value', function() {
        expect(this.inputView.getQuery()).toEqual('new');
      });
    });

    describe('if only whitespace in query has changed', function() {
      beforeEach(function() {
        this.inputView.query = 'old town';
        this.inputView.$input.val('old   town');

        simulateKeyEvent(this.$input, 'input', KEY_MAP.NORMAL);
      });

      it('should trigger whitespaceChange', function() {
        expect(this.wcSpy).toHaveBeenCalled();
      });

      it('should not trigger queryChange', function() {
        expect(this.qcSpy).not.toHaveBeenCalled();
      });

      it('should not update internal query value', function() {
        expect(this.inputView.getQuery()).toEqual('old town');
      });
    });

    describe('if the query did not change', function() {
      beforeEach(function() {
        this.inputView.query = 'old';
        this.inputView.$input.val('old');

        simulateKeyEvent(this.$input, 'input', KEY_MAP.NORMAL);
      });

      it('should not trigger queryChange', function() {
        expect(this.qcSpy).not.toHaveBeenCalled();
      });

      it('should not trigger whitespaceChange', function() {
        expect(this.wcSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('#focus', function() {
    beforeEach(function() {
      this.inputView.focus();
    });

    it('should focus on the input', function() {
      expect(this.$input).toBeFocused();
    });
  });

  describe('#blur', function() {
    beforeEach(function() {
      this.$input.focus();
      this.inputView.blur();
    });

    it('should blur on the input', function() {
      expect(this.$input).not.toBeFocused();
    });
  });

  describe('#setPreventDefaultValueForKey', function() {
    it('should act as a setter for keyCodeMap', function() {
      var key = '9';

      this.inputView.setPreventDefaultValueForKey(key, 'truthy value');
      expect(this.inputView.specialKeyCodeMap[key].preventDefault).toBe(true);

      this.inputView.setPreventDefaultValueForKey(key, false);
      expect(this.inputView.specialKeyCodeMap[key].preventDefault).toBe(false);
    });
  });

  describe('#getQuery', function() {
    it('should act as a getter for query', function() {
      this.inputView.query = 'i am the query value';
      expect(this.inputView.getQuery()).toBe('i am the query value');
    });
  });

  describe('#getInputValue', function() {
    it('should return the value of the input', function() {
      this.$input.val('i am input');
      expect(this.inputView.getInputValue()).toBe('i am input');
    });
  });

  describe('#setInputValue', function() {
    it('should set the value of the input', function() {
      this.inputView.setInputValue('updated input');
      expect(this.$input).toHaveValue('updated input');
    });
  });

  describe('#getHintValue', function() {
    it('should return the value of the hint', function() {
      this.$hint.val('i am a hint');
      expect(this.inputView.getHintValue()).toBe('i am a hint');
    });
  });

  describe('#setHintValue', function() {
    it('should set the value of the hint', function() {
      this.inputView.setHintValue('updated hint');
      expect(this.$hint).toHaveValue('updated hint');
    });
  });

  describe('#getLanguageDirection', function() {
    it('should default to ltr', function() {
      expect(this.inputView.getLanguageDirection()).toBe('ltr');
    });

    it('should return value of input\'s dir attribute', function() {
      this.$input.attr('dir', 'rtl');
      expect(this.inputView.getLanguageDirection()).toBe('rtl');
    });
  });

  describe('#isCursorAtEnd', function() {
    beforeEach(function() {
      this.$input.val('text cursor goes here');
    });

    describe('when cursor is not at the end', function() {
      beforeEach(function() {
        setCursorPosition(this.$input, this.$input.val().length / 2);
      });

      it('should return false', function() {
        expect(this.inputView.isCursorAtEnd()).toBe(false);
      });
    });

    describe('when cursor is at the end', function() {
      beforeEach(function() {
        setCursorPosition(this.$input, this.$input.val().length);
      });

      it('should return true', function() {
        expect(this.inputView.isCursorAtEnd()).toBe(true);
      });
    });
  });

  // helper functions
  // ----------------

  function simulateKeyEvent($node, type, key) {
    var event = $.Event(type, { keyCode: key });

    spyOn(event, 'preventDefault');
    $node.trigger(event);

    return event;
  }

  function setCursorPosition($input, pos) {
    var input = $input[0], range;

    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(pos, pos);
    }

    else if (input.createTextRange) {
      range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  }
});
