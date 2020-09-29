/*
 * Copyright (c) 2020 TASoft Applications, Th. Abplanalp <info@tasoft.ch>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/*
The MIT License (MIT)

Copyright (c) 2014-2019 Materialize

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
(function($) {
    window.Skyline.TimePicker = function(el, options) {
        this.id = Skyline.guid();
        this.el = el;
        this.$el = $(el);
        this.options = $.extend({}, window.Skyline.TimePicker._defaults, options);

        this.$modalEl = $(window.Skyline.TimePicker._template);
        this.modalEl = this.$modalEl[0];
        this.modalEl.id = 'modal-' + this.id;

        // Append popover to input by default
        if (this.options.container) {
            this.$modalEl.appendTo(this.options.container);
        } else {
            this.$modalEl.insertBefore(this.el);
        }

        this.formats = {
            g: (date) => {
                return date.getHours();
            },
            h: (date) => {
                let d = date.getHours() % 12;
                return d === 0 ? 12 : d;
            },
            H: (date) => {
                let d = date.getHours() % 12;
                d = d === 0 ? 12 : d;
                return (d < 10 ? '0' : '') + d;
            },
            G: (date) => {
                let d = date.getHours()
                return (d < 10 ? '0' : '') + d;
            },
            m: (date) => {
                let d = date.getMinutes();
                return (d < 10 ? '0' : '') + d;
            },
            s: (date) => {
                let d = date.getSeconds();
                return (d < 10 ? '0' : '') + d;
            },
            a: (date) => {
                let d = date.getHours();
                return d > 11 ? 'pm' : 'am';
            },
            A: (date) => {
                let d = date.getHours();
                return d > 11 ? 'PM' : 'AM';
            }
        };

        var handlers = {
            _handleInputClick: function() {
                if(this.options.autoOpen)
                    this.open();
            },

            _handleInputKeydown: function(e) {
                if (e.which === Skyline.keys.ENTER && this.options.autoOpen) {
                    e.preventDefault();
                    this.open();
                }
            },

            _handleClockClickStart: function(e) {
                e.preventDefault();
                let clockPlateBR = this.plate.getBoundingClientRect();
                let offset = { x: clockPlateBR.left, y: clockPlateBR.top };

                this.x0 = offset.x + this.options.dialRadius;
                this.y0 = offset.y + this.options.dialRadius;
                this.moved = false;
                let clickPos = window.Skyline.TimePicker._Pos(e);
                this.dx = clickPos.x - this.x0;
                this.dy = clickPos.y - this.y0;

                // Set clock hands
                this.setHand(this.dx, this.dy, false);

                // Mousemove on document
                document.addEventListener('mousemove', this._handleDocumentClickMoveBound);
                document.addEventListener('touchmove', this._handleDocumentClickMoveBound);

                // Mouseup on document
                document.addEventListener('mouseup', this._handleDocumentClickEndBound);
                document.addEventListener('touchend', this._handleDocumentClickEndBound);
            },

            _handleDocumentClickMove: function (e) {
                e.preventDefault();
                let clickPos = window.Skyline.TimePicker._Pos(e);
                let x = clickPos.x - this.x0;
                let y = clickPos.y - this.y0;
                this.moved = true;
                this.setHand(x, y, false, true);
            },

            _handleDocumentClickEnd: function (e) {
                e.preventDefault();
                document.removeEventListener('mouseup', this._handleDocumentClickEndBound);
                document.removeEventListener('touchend', this._handleDocumentClickEndBound);
                let clickPos = window.Skyline.TimePicker._Pos(e);
                let x = clickPos.x - this.x0;
                let y = clickPos.y - this.y0;
                if (this.moved && x === this.dx && y === this.dy) {
                    this.setHand(x, y);
                }

                if (this.currentView === 'hours') {
                    this.showView('minutes', this.options.duration / 2);
                } else if (this.options.autoClose) {
                    $(this.minutesView).addClass('timepicker-dial-out');
                    setTimeout(() => {
                        this.done();
                    }, this.options.duration / 2);
                }

                if (typeof this.options.onSelect === 'function') {
                    this.options.onSelect.call(this, this.hours, this.minutes);
                }

                // Unbind mousemove event
                document.removeEventListener('mousemove', this._handleDocumentClickMoveBound);
                document.removeEventListener('touchmove', this._handleDocumentClickMoveBound);
            }
        };

        var self = this;
        this.$modalEl
            .on('show.bs.modal', this.options.onOpenStart)
            .on('shown.bs.modal', this.options.onOpenEnd)
            .on('hide.bs.modal', this.options.onCloseStart)
            .on('hidden.bs.modal', function() {
                if (typeof self.options.onCloseEnd === 'function') {
                    self.options.onCloseEnd.call(this);
                }
                self.isOpen = false;
            });

        this._get24Hours = function() {
            let h=self.hours;

            if(self.options.twelveHour) {
                if(self.amOrPm === 'PM')
                    h+=12;
                if(self.amOrPm === 'AM' && h === 12)
                    h = 0;
            }
            return h;
        };

        this._mirror = function() {
            if(self.options.mirror && self.options.mirrorFormat)
                $(self.options.mirror).val( self.formatDate(new Date(2000, 1, 1,self._get24Hours(), self.minutes), self.options.mirrorFormat) );
        };

        this.currentView = 'hours';
        this.vibrate = navigator.vibrate
            ? 'vibrate'
            : navigator.webkitVibrate
                ? 'webkitVibrate'
                : null;

        this._canvas = this.modalEl.querySelector('.timepicker-canvas');
        this.plate = this.modalEl.querySelector('.timepicker-plate');

        this.hoursView = this.modalEl.querySelector('.timepicker-hours');
        this.minutesView = this.modalEl.querySelector('.timepicker-minutes');
        this.spanHours = this.modalEl.querySelector('.timepicker-span-hours');
        this.spanMinutes = this.modalEl.querySelector('.timepicker-span-minutes');
        this.spanAmPm = this.modalEl.querySelector('.timepicker-span-am-pm');
        this.footer = this.modalEl.querySelector('.timepicker-footer');
        this.amOrPm = 'PM';

        this._handleInputKeydownBound = handlers._handleInputKeydown.bind(this);
        this._handleInputClickBound = handlers._handleInputClick.bind(this);
        this._handleClockClickStartBound = handlers._handleClockClickStart.bind(this);
        this._handleDocumentClickMoveBound = handlers._handleDocumentClickMove.bind(this);
        this._handleDocumentClickEndBound = handlers._handleDocumentClickEnd.bind(this);

        this.el.addEventListener('click', this._handleInputClickBound);
        this.el.addEventListener('keydown', this._handleInputKeydownBound);
        this.plate.addEventListener('mousedown', this._handleClockClickStartBound);
        this.plate.addEventListener('touchstart', this._handleClockClickStartBound);

        this.showView=function(view, delay) {
            if (view === 'minutes' && $(this.hoursView).css('visibility') === 'visible') {
                // raiseCallback(this.options.beforeHourSelect);
            }
            let isHours = view === 'hours',
                nextView = isHours ? this.hoursView : this.minutesView,
                hideView = isHours ? this.minutesView : this.hoursView;
            this.currentView = view;

            $(this.spanHours).toggleClass('text-active', isHours);
            $(this.spanMinutes).toggleClass('text-active', !isHours);

            // Transition view
            hideView.classList.add('timepicker-dial-out');
            $(nextView)
                .css('visibility', 'visible')
                .removeClass('timepicker-dial-out');

            // Reset clock hand
            this.resetClock(delay);

            // After transitions ended
            clearTimeout(this.toggleViewTimer);
            this.toggleViewTimer = setTimeout(() => {
                $(hideView).css('visibility', 'hidden');
            }, this.options.duration);
        }

        $(this.spanHours).on('click', this.showView.bind(this, 'hours'));
        $(this.spanMinutes).on('click', this.showView.bind(this, 'minutes'));

        this._handleAmPmClick = function(e) {
            let $btnClicked = $(e.target);
            this.amOrPm = $btnClicked.hasClass('am-btn') ? 'AM' : 'PM';
            this._updateAmPmView();
        };

        if (this.options.twelveHour) {
            this.$amBtn = $('<div class="am-btn">AM</div>');
            this.$pmBtn = $('<div class="pm-btn">PM</div>');
            this.$amBtn.on('click', this._handleAmPmClick.bind(this)).appendTo(this.spanAmPm);
            this.$pmBtn.on('click', this._handleAmPmClick.bind(this)).appendTo(this.spanAmPm);
        }

        this._updateAmPmView = function() {
            if (this.options.twelveHour) {
                this.$amBtn.toggleClass('text-active', this.amOrPm === 'AM');
                this.$pmBtn.toggleClass('text-active', this.amOrPm === 'PM');
            }
        };

        this._updateTimeFromInput=function () {
            // Get the time
            this.hours=this.minutes=-1;
            let self = this;

            ((this.el.value || this.options.defaultTime || '') + '').split(/(\d+|AM|PM)/ig).forEach(function(e) {
                var n=e*1;

                if (e.toLowerCase() === 'now') {
                    let now = new Date(+new Date() + self.options.fromNow);
                    value = [now.getHours(), now.getMinutes()];
                    if (self.options.twelveHour) {
                        self.amOrPm = value[0] >= 12 && value[0] < 24 ? 'PM' : 'AM';
                    }
                    self.hours = now.getHours();
                    self.minutes = now.getMinutes();
                    return;
                }

                if(e.toLowerCase()==='am') {
                    self.hours = self.hours%12;

                    if(self.options.twelveHour) {
                        if(self.hours === 0)
                            self.hours = 12;
                        self.amOrPm = 'AM';
                        return;
                    }
                }
                if(e.toLowerCase()==='pm') {
                    self.hours = self.hours%12 + 12;
                    if(self.hours === 0)
                        self.hours = 12;
                    self.amOrPm = 'PM';
                    return;
                }

                if(isNaN(n) || e==="")
                    return;

                if(self.hours===-1) {
                    if(n>12)
                        self.amOrPm = 'PM';
                    else if(n < 12)
                        self.amOrPm = 'AM';
                    else if(!self.options.twelveHour)
                        self.amOrPm = 'PM';
                    else
                        self.amOrPm = 'AM';

                    if(self.options.twelveHour && n===0)
                        n=12;
                    return self.hours = n;
                }
                if(self.minutes===-1) {
                    if(self.options.twelveHour && n===0)
                        n=12;
                    return self.minutes = n;
                }
            });

            this.spanHours.innerHTML = this.hours;
            this.spanMinutes.innerHTML = window.Skyline.TimePicker._addLeadingZero(this.minutes);

            this._mirror();
            this._updateAmPmView();

            if(this.options.autoUpdate)
                this.el.value = this.formatDate(new Date(2000, 1, 1, this._get24Hours(), this.minutes), this.options.format);
        };

        this._buildSVGClock = function() {
            // Draw clock hands and others
            let dialRadius = this.options.dialRadius;
            let tickRadius = this.options.tickRadius;
            let diameter = dialRadius * 2;

            let svg = window.Skyline.TimePicker._createSVGEl('svg');
            svg.setAttribute('class', 'timepicker-svg');
            svg.setAttribute('width', diameter);
            svg.setAttribute('height', diameter);
            let g = window.Skyline.TimePicker._createSVGEl('g');
            g.setAttribute('transform', 'translate(' + dialRadius + ',' + dialRadius + ')');
            let bearing = window.Skyline.TimePicker._createSVGEl('circle');
            bearing.setAttribute('class', 'timepicker-canvas-bearing');
            bearing.setAttribute('cx', 0);
            bearing.setAttribute('cy', 0);
            bearing.setAttribute('r', 4);
            let hand = window.Skyline.TimePicker._createSVGEl('line');
            hand.setAttribute('x1', 0);
            hand.setAttribute('y1', 0);
            let bg = window.Skyline.TimePicker._createSVGEl('circle');
            bg.setAttribute('class', 'timepicker-canvas-bg');
            bg.setAttribute('r', tickRadius);
            g.appendChild(hand);
            g.appendChild(bg);
            g.appendChild(bearing);
            svg.appendChild(g);
            this._canvas.appendChild(svg);

            this.hand = hand;
            this.bg = bg;
            this.bearing = bearing;
            this.g = g;
        }

        this._buildHoursView= function() {
            let $tick = $('<div class="timepicker-tick"></div>');
            // Hours view
            if (this.options.twelveHour) {
                for (let i = 1; i < 13; i += 1) {
                    let tick = $tick.clone();
                    let radian = i / 6 * Math.PI;
                    let radius = this.options.outerRadius;
                    tick.css({
                        left:
                            this.options.dialRadius + Math.sin(radian) * radius - this.options.tickRadius + 'px',
                        top:
                            this.options.dialRadius - Math.cos(radian) * radius - this.options.tickRadius + 'px'
                    });
                    tick.html(i === 0 ? '00' : i);
                    this.hoursView.appendChild(tick[0]);
                    // tick.on(mousedownEvent, mousedown);
                }
            } else {
                for (let i = 0; i < 24; i += 1) {
                    let tick = $tick.clone();
                    let radian = i / 6 * Math.PI;
                    let inner = i > 0 && i < 13;
                    let radius = inner ? this.options.innerRadius : this.options.outerRadius;
                    tick.css({
                        left:
                            this.options.dialRadius + Math.sin(radian) * radius - this.options.tickRadius + 'px',
                        top:
                            this.options.dialRadius - Math.cos(radian) * radius - this.options.tickRadius + 'px'
                    });
                    tick.html(i === 0 ? '00' : i);
                    this.hoursView.appendChild(tick[0]);
                    // tick.on(mousedownEvent, mousedown);
                }
            }
        }

        this._buildMinutesView=function() {
            let $tick = $('<div class="timepicker-tick"></div>');
            // Minutes view
            for (let i = 0; i < 60; i += 5) {
                let tick = $tick.clone();
                let radian = i / 30 * Math.PI;
                tick.css({
                    left:
                        this.options.dialRadius +
                        Math.sin(radian) * this.options.outerRadius -
                        this.options.tickRadius +
                        'px',
                    top:
                        this.options.dialRadius -
                        Math.cos(radian) * this.options.outerRadius -
                        this.options.tickRadius +
                        'px'
                });
                tick.html(window.Skyline.TimePicker._addLeadingZero(i));
                this.minutesView.appendChild(tick[0]);
            }
        }

        this.resetClock=function(delay) {
            let view = this.currentView,
                value = this[view],
                isHours = view === 'hours',
                unit = Math.PI / (isHours ? 6 : 30),
                radian = value * unit,
                radius =
                    isHours && value > 0 && value < 13 ? this.options.innerRadius : this.options.outerRadius,
                x = Math.sin(radian) * radius,
                y = -Math.cos(radian) * radius,
                self = this;

            if (delay) {
                $(this.canvas).addClass('timepicker-canvas-out');
                setTimeout(() => {
                    $(self.canvas).removeClass('timepicker-canvas-out');
                    self.setHand(x, y);
                }, delay);
            } else {
                this.setHand(x, y);
            }
        }

        this.setHand=function(x, y, roundBy5) {
            let radian = Math.atan2(x, -y),
                isHours = this.currentView === 'hours',
                unit = Math.PI / (isHours || roundBy5 ? 6 : 30),
                z = Math.sqrt(x * x + y * y),
                inner = isHours && z < (this.options.outerRadius + this.options.innerRadius) / 2,
                radius = inner ? this.options.innerRadius : this.options.outerRadius;

            if (this.options.twelveHour) {
                radius = this.options.outerRadius;
            }

            // Radian should in range [0, 2PI]
            if (radian < 0) {
                radian = Math.PI * 2 + radian;
            }

            // Get the round value
            let value = Math.round(radian / unit);

            // Get the round radian
            radian = value * unit;

            // Correct the hours or minutes
            if (this.options.twelveHour) {
                if (isHours) {
                    if (value === 0) value = 12;
                } else {
                    if (roundBy5) value *= 5;
                    if (value === 60) value = 0;
                }
            } else {
                if (isHours) {
                    if (value === 12) {
                        value = 0;
                    }
                    value = inner ? (value === 0 ? 12 : value) : value === 0 ? 0 : value + 12;
                } else {
                    if (roundBy5) {
                        value *= 5;
                    }
                    if (value === 60) {
                        value = 0;
                    }
                }
            }

            // Once hours or minutes changed, vibrate the device
            if (this[this.currentView] !== value) {
                if (this.vibrate && this.options.vibrate) {
                    // Do not vibrate too frequently
                    if (!this.vibrateTimer) {
                        navigator[this.vibrate](10);
                        this.vibrateTimer = setTimeout(() => {
                            this.vibrateTimer = null;
                        }, 100);
                    }
                }
            }

            this[this.currentView] = value;
            if (isHours) {
                this['spanHours'].innerHTML = value;
            } else {
                this['spanMinutes'].innerHTML = window.Skyline.TimePicker._addLeadingZero(value);
            }

            // Set clock hand and others' position
            let cx1 = Math.sin(radian) * (radius - this.options.tickRadius),
                cy1 = -Math.cos(radian) * (radius - this.options.tickRadius),
                cx2 = Math.sin(radian) * radius,
                cy2 = -Math.cos(radian) * radius;
            this.hand.setAttribute('x2', cx1);
            this.hand.setAttribute('y2', cy1);
            this.bg.setAttribute('cx', cx2);
            this.bg.setAttribute('cy', cy2);
        }

        this.open=function() {
            if (this.isOpen) {
                return;
            }

            this.isOpen = true;
            this._updateTimeFromInput();
            this.showView('hours');

            this.$modalEl.modal("show");
        }

        this.close=function() {
            if (!this.isOpen) {
                return;
            }

            this.isOpen = false;
            this.$modalEl.modal("hide");
        }

        this.formatDate = function(date, format) {
            let formatArray = format.split(/(h|m|s|a|g)/ig);
            let formattedDate = formatArray
                .map((label) => {
                    if (this.formats[label]) {
                        return this.formats[label](date);
                    }

                    return label;
                })
                .join('');
            return formattedDate;
        };

        /**
         * Finish timepicker selection.
         */
        this.done=function(e, clearValue) {
            // Set input value
            let last = this.el.value;
            this.el.value = this.formatDate(new Date(2000, 1, 1, this._get24Hours(), this.minutes), this.options.format);

            this._mirror();

            // Trigger change event
            if (this.el.value !== last) {
                this.$el.trigger('change');
            }

            this.close();
            this.el.focus();
        }

        this.clear=function() {
            this.done(null, true);
        }

        this._buildHoursView();
        this._buildMinutesView();
        this._buildSVGClock();

        let $clearBtn = $(
            `<button class="btn-flat timepicker-clear waves-effect" style="visibility: hidden;" type="button" tabindex="${
                this.options.twelveHour ? '3' : '1'
            }">${this.options.i18n.clear}</button>`
        )
            .appendTo(this.footer)
            .on('click', this.clear.bind(this));
        if (this.options.showClearBtn) {
            $clearBtn.css({ visibility: '' });
        }

        let confirmationBtnsContainer = $('<div class="confirmation-btns"></div>');
        $(
            '<button class="btn-flat timepicker-close waves-effect" type="button" tabindex="' +
            (this.options.twelveHour ? '3' : '1') +
            '">' +
            this.options.i18n.cancel +
            '</button>'
        )
            .appendTo(confirmationBtnsContainer)
            .on('click', this.close.bind(this));
        $(
            '<button class="btn-flat timepicker-close waves-effect" type="button" tabindex="' +
            (this.options.twelveHour ? '3' : '1') +
            '">' +
            this.options.i18n.done +
            '</button>'
        )
            .appendTo(confirmationBtnsContainer)
            .on('click', this.done.bind(this));
        confirmationBtnsContainer.appendTo(this.footer);

        this._updateTimeFromInput();
        this.el.addEventListener('change', this._updateTimeFromInput.bind(this), true);
    }

    window.Skyline.TimePicker._defaults = {
        dialRadius: 135,
        outerRadius: 105,
        innerRadius: 70,
        tickRadius: 20,
        duration: 350,
        container: $(document.body),
        defaultTime: 'now', // default time, 'now' or '13:14' e.g.
        fromNow: 0, // Millisecond offset from the defaultTime
        showClearBtn: false,
        format:"h:mm",

        // Mirror the selected date in another form control defined by this property (jQuery selector)
        mirror: null,
        // Define the format for mirroring
        mirrorFormat: null,

        // internationalization
        i18n: {
            cancel: 'Cancel',
            clear: 'Clear',
            done: 'Ok'
        },

        autoOpen: true,
        autoUpdate: false,
        autoClose: false, // auto close when minute is selected
        twelveHour: false, // change to 12 hour AM/PM clock from 24 hour
        vibrate: true, // vibrate the device when dragging clock hand

        // Callbacks
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onSelect: null
    };

    window.Skyline.TimePicker._addLeadingZero = function(num) {
        return (num < 10 ? '0' : '') + num;
    };

    window.Skyline.TimePicker._createSVGEl = function(name) {
        let svgNS = 'http://www.w3.org/2000/svg';
        return document.createElementNS(svgNS, name);
    }

    window.Skyline.TimePicker._Pos = function(e) {
        if (e.targetTouches && e.targetTouches.length >= 1) {
            return { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
        }
        // mouse event
        return { x: e.clientX, y: e.clientY };
    }

    window.Skyline.TimePicker._template = [
        '<div class= "modal timepicker-modal fade" role="dialog">',
        '<div class="modal-dialog" role="document">',
        '<div class="modal-content timepicker-container">',
        '<div class="timepicker-digital-display">',
        '<div class="timepicker-text-container">',
        '<div class="timepicker-display-column">',
        '<span class="timepicker-span-hours"></span>',
        ':',
        '<span class="timepicker-span-minutes"></span>',
        '</div>',
        '<div class="timepicker-display-column timepicker-display-am-pm">',
        '<div class="timepicker-span-am-pm"></div>',
        '</div>',
        '</div>',
        '</div>',
        '<div class="timepicker-analog-display">',
        '<div class="timepicker-plate">',
        '<div class="timepicker-canvas"></div>',
        '<div class="timepicker-dial timepicker-hours"></div>',
        '<div class="timepicker-dial timepicker-minutes timepicker-dial-out"></div>',
        '</div>',
        '<div class="timepicker-footer"></div>',
        '</div>',
        '</div>',
        '</div>',
        '</div>'
    ].join('');

    $.fn.timepicker = function(action, options) {
        $(this).each(function() {
            if(!this.Sky_Timepicker)
                this.Sky_Timepicker = new window.Skyline.TimePicker(this, options);
        });

        var PK = this[0].Sky_Timepicker;
        if(action === 'open')
            PK.open();
        if(action === 'instance')
            return PK;
        if(action==='update')
            PK._updateTimeFromInput();
        return this;
    };
})(jQuery);