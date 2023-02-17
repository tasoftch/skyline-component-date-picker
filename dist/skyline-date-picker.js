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
    window.Skyline.DatePicker = function (el, options) {
        this.id = Skyline.guid();

        this.el = el;
        this.$el = $(el);
        this.options = $.extend({}, window.Skyline.DatePicker._defaults, options);
        if (!!options && options.hasOwnProperty('i18n') && typeof options.i18n === 'object') {
            this.options.i18n = $.extend({}, window.Skyline.DatePicker.defaults.i18n, options.i18n);
        }
        if (this.options.minDate) this.options.minDate.setHours(0, 0, 0, 0);
        if (this.options.maxDate) this.options.maxDate.setHours(0, 0, 0, 0);

        this.$modalEl = $(window.Skyline.DatePicker._template);
        this.modalEl = this.$modalEl[0];

        this.calendarEl = this.modalEl.querySelector('.datepicker-calendar');

        this.yearTextEl = this.modalEl.querySelector('.year-text');
        this.dateTextEl = this.modalEl.querySelector('.date-text');
        if (this.options.showClearBtn) {
            this.clearBtn = this.modalEl.querySelector('.datepicker-clear');
        }
        this.doneBtn = this.modalEl.querySelector('.datepicker-done');
        this.cancelBtn = this.modalEl.querySelector('.datepicker-cancel');

        this.formats = {
            d: (date) => {
                return date.getDate();
            },
            dd: (date) => {
                let d = date.getDate();
                return (d < 10 ? '0' : '') + d;
            },
            ddd: (date) => {
                return this.options.i18n.weekdaysShort[date.getDay()];
            },
            dddd: (date) => {
                return this.options.i18n.weekdays[date.getDay()];
            },
            m: (date) => {
                return date.getMonth() + 1;
            },
            mm: (date) => {
                let m = date.getMonth() + 1;
                return (m < 10 ? '0' : '') + m;
            },
            mmm: (date) => {
                return this.options.i18n.monthsShort[date.getMonth()];
            },
            mmmm: (date) => {
                return this.options.i18n.months[date.getMonth()];
            },
            yy: (date) => {
                return ('' + date.getFullYear()).slice(2);
            },
            yyyy: (date) => {
                return date.getFullYear();
            }
        };

        if (this.options.showClearBtn) {
            $(this.clearBtn).css({ visibility: '' });
            this.clearBtn.innerHTML = this.options.i18n.clear;
        }

        this.doneBtn.innerHTML = this.options.i18n.done;
        this.cancelBtn.innerHTML = this.options.i18n.cancel;

        if (this.options.container) {
            this.$modalEl.appendTo(this.options.container);
        } else {
            this.$modalEl.insertBefore(this.el);
        }

        this.modalEl.id = 'modal-' + this.id;
        var self = this;
        $(this.modalEl).on("hidden.bs.modal", function() {
            self.isOpen = false;
        });

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

            _handleCalendarClick: function(e) {
                if (!this.isOpen) {
                    return;
                }

                let $target = $(e.target);
                if (!$target.hasClass('is-disabled')) {
                    if (
                        $target.hasClass('datepicker-day-button') &&
                        !$target.hasClass('is-empty') &&
                        !$target.parent().hasClass('is-disabled')
                    ) {
                        this.setDate(
                            new Date(
                                e.target.getAttribute('data-year'),
                                e.target.getAttribute('data-month'),
                                e.target.getAttribute('data-day')
                            )
                        );
                        if (this.options.autoClose) {
                            this._finishSelectionBound();
                        }
                    } else if ($target.closest('.month-prev').length) {
                        this.prevMonth();
                    } else if ($target.closest('.month-next').length) {
                        this.nextMonth();
                    }
                }
            },

            _handleClearClick: function() {
                this.date = null;
                this.setInputValue();
                this.close();
            },

            _handleMonthChange: function(e) {
                this.gotoMonth(e.target.value);
            },

            _handleYearChange: function(e) {
                this.gotoYear(e.target.value);
            },
            _handleInputChange: function(e) {
                let date;

                // Prevent change event from being fired when triggered by the plugin
                if (e.firedBy === this) {
                    return;
                }
                this.$el.removeClass("is-invalid");

                if (this.options.parse) {
                    try {
                        date = this.options.parse(this.el.value, this.options.format, this);
                    } catch (e) {
                        this.$el.addClass("is-invalid");
                    }
                } else {
                    date = new Date(Date.parse(this.el.value));

                }

                if (window.Skyline.DatePicker._isDate(date)) {
                    this.setDate(date);
                    if(this.options.autoUpdate)
                        this.setInputValue();

                    if(this.options.mirror && this.options.mirrorFormat) {
                        $(this.options.mirror).val( this.formatDate( date, this.options.mirrorFormat ) );
                    }
                }
            },

            _finishSelection() {
                this.setInputValue();
                this.close();
            }
        }

        this.close = function() {
            if (!this.isOpen) {
                return;
            }

            this.isOpen = false;
            if (typeof this.options.onClose === 'function') {
                this.options.onClose.call(this);
            }
            $("#modal-"+this.id).modal("hide");
            return this;
        }

        this._handleInputKeydownBound = handlers._handleInputKeydown.bind(this);
        this._handleInputClickBound = handlers._handleInputClick.bind(this);
        this._handleInputChangeBound = handlers._handleInputChange.bind(this);
        this._handleCalendarClickBound = handlers._handleCalendarClick.bind(this);
        this._finishSelectionBound = handlers._finishSelection.bind(this);
        this._handleMonthChange = handlers._handleMonthChange.bind(this);
        this._closeBound = this.close.bind(this);

        this.el.addEventListener('click', this._handleInputClickBound);
        this.el.addEventListener('keydown', this._handleInputKeydownBound);
        this.el.addEventListener('change', this._handleInputChangeBound);
        this.calendarEl.addEventListener('click', this._handleCalendarClickBound);
        this.doneBtn.addEventListener('click', this._finishSelectionBound);
        this.cancelBtn.addEventListener('click', this._closeBound);

        if (this.options.showClearBtn) {
            this._handleClearClickBound = handlers._handleClearClick.bind(this);
            this.clearBtn.addEventListener('click', this._handleClearClickBound);
        }

        this.removeEventHandlers = function() {
            this.el.removeEventListener('click', this._handleInputClickBound);
            this.el.removeEventListener('keydown', this._handleInputKeydownBound);
            this.el.removeEventListener('change', this._handleInputChangeBound);
            this.calendarEl.removeEventListener('click', this._handleCalendarClickBound);
        };

        /**
         * change view to a specific month (zero-index, e.g. 0: January)
         */
        this.gotoMonth = function(month) {
            if (!isNaN(month)) {
                this.calendars[0].month = parseInt(month, 10);
                this.adjustCalendars();
            }
        };

        /**
         * change view to a specific full year (e.g. "2012")
         */
        this.gotoYear = function(year) {
            if (!isNaN(year)) {
                this.calendars[0].year = parseInt(year, 10);
                this.adjustCalendars();
            }
        };

        this.gotoDate = function(date) {
            let newCalendar = true;

            if (!window.Skyline.DatePicker._isDate(date)) {
                return;
            }

            if (this.calendars) {
                let firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
                    lastVisibleDate = new Date(
                        this.calendars[this.calendars.length - 1].year,
                        this.calendars[this.calendars.length - 1].month,
                        1
                    ),
                    visibleDate = date.getTime();
                // get the end of the month
                lastVisibleDate.setMonth(lastVisibleDate.getMonth() + 1);
                lastVisibleDate.setDate(lastVisibleDate.getDate() - 1);
                newCalendar =
                    visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate;
            }

            if (newCalendar) {
                this.calendars = [
                    {
                        month: date.getMonth(),
                        year: date.getFullYear()
                    }
                ];
            }

            this.adjustCalendars();
        };

        this.renderDayName = function(opts, day, abbr) {
            day += opts.firstDay;
            while (day >= 7) {
                day -= 7;
            }
            return abbr ? opts.i18n.weekdaysAbbrev[day] : opts.i18n.weekdays[day];
        };

        this.open = function() {
            if (this.isOpen) {
                return;
            }

            this.isOpen = true;
            if (typeof this.options.onOpen === 'function') {
                this.options.onOpen.call(this);
            }
            this.draw();
            $("#modal-"+this.id).modal("show");
            return this;
        }

        this.setDate = function(date, preventOnSelect) {
            if (!date) {
                this.date = null;
                this._renderDateDisplay();
                return this.draw();
            }
            if (typeof date === 'string') {
                date = new Date(Date.parse(date));
            }
            if (!window.Skyline.DatePicker._isDate(date)) {
                return;
            }

            let min = this.options.minDate,
                max = this.options.maxDate;

            if (window.Skyline.DatePicker._isDate(min) && date < min) {
                date = min;
            } else if (window.Skyline.DatePicker._isDate(max) && date > max) {
                date = max;
            }

            this.date = new Date(date.getTime());

            this._renderDateDisplay();

            window.Skyline.DatePicker._setToStartOfDay(this.date);
            this.gotoDate(this.date);

            if (!preventOnSelect && typeof this.options.onSelect === 'function') {
                this.options.onSelect.call(this, this.date);
            }
        }

        this.toString = function(format) {
            format = format || this.options.format;
            if (!window.Skyline.DatePicker._isDate(this.date)) {
                return '';
            }
            return this.formatDate(this.date, format);
        }

        this.formatDate = function(date, format) {
            let formatArray = format.split(/(d{1,4}|m{1,4}|y{4}|yy|!.)/g);
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

        this.setInputValue = function() {
            this.el.value = this.toString();
            if(this.options.mirror && this.options.mirrorFormat) {
                $(this.options.mirror).val( this.date ? this.formatDate(this.date, this.options.mirrorFormat) : "" );
            }

            this.$el.trigger('change', { firedBy: this });
        }

        this.adjustCalendars = function() {
            this.calendars[0] = this.adjustCalendar(this.calendars[0]);
            this.draw();
        }

        this.adjustCalendar = function(calendar) {
            if (calendar.month < 0) {
                calendar.year -= Math.ceil(Math.abs(calendar.month) / 12);
                calendar.month += 12;
            }
            if (calendar.month > 11) {
                calendar.year += Math.floor(Math.abs(calendar.month) / 12);
                calendar.month -= 12;
            }
            return calendar;
        }

        this.nextMonth = function() {
            this.calendars[0].month++;
            this.adjustCalendars();
        }

        this.prevMonth = function() {
            this.calendars[0].month--;
            this.adjustCalendars();
        }

        this.render = function(year, month, randId) {
            let opts = this.options,
                now = new Date(),
                days = window.Skyline.DatePicker._getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data = [],
                row = [];
            window.Skyline.DatePicker._setToStartOfDay(now);
            if (opts.firstDay > 0) {
                before -= opts.firstDay;
                if (before < 0) {
                    before += 7;
                }
            }
            let previousMonth = month === 0 ? 11 : month - 1,
                nextMonth = month === 11 ? 0 : month + 1,
                yearOfPreviousMonth = month === 0 ? year - 1 : year,
                yearOfNextMonth = month === 11 ? year + 1 : year,
                daysInPreviousMonth = window.Skyline.DatePicker._getDaysInMonth(yearOfPreviousMonth, previousMonth);
            let cells = days + before,
                after = cells;
            while (after > 7) {
                after -= 7;
            }
            cells += 7 - after;
            let isWeekSelected = false;
            for (let i = 0, r = 0; i < cells; i++) {
                let day = new Date(year, month, 1 + (i - before)),
                    isSelected = window.Skyline.DatePicker._isDate(this.date)
                        ? window.Skyline.DatePicker._compareDates(day, this.date)
                        : false,
                    isToday = window.Skyline.DatePicker._compareDates(day, now),
                    hasEvent = opts.events.indexOf(day.toDateString()) !== -1 ? true : false,
                    isEmpty = i < before || i >= days + before,
                    dayNumber = 1 + (i - before),
                    monthNumber = month,
                    yearNumber = year,
                    isStartRange = opts.startRange && window.Skyline.DatePicker._compareDates(opts.startRange, day),
                    isEndRange = opts.endRange && window.Skyline.DatePicker._compareDates(opts.endRange, day),
                    isInRange =
                        opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange,
                    isDisabled =
                        (opts.minDate && day < opts.minDate) ||
                        (opts.maxDate && day > opts.maxDate) ||
                        (opts.disableWeekends && window.Skyline.DatePicker._isWeekend(day)) ||
                        (opts.disableDayFn && opts.disableDayFn(day));

                if (isEmpty) {
                    if (i < before) {
                        dayNumber = daysInPreviousMonth + dayNumber;
                        monthNumber = previousMonth;
                        yearNumber = yearOfPreviousMonth;
                    } else {
                        dayNumber = dayNumber - days;
                        monthNumber = nextMonth;
                        yearNumber = yearOfNextMonth;
                    }
                }

                let dayConfig = {
                    day: dayNumber,
                    month: monthNumber,
                    year: yearNumber,
                    hasEvent: hasEvent,
                    isSelected: isSelected,
                    isToday: isToday,
                    isDisabled: isDisabled,
                    isEmpty: isEmpty,
                    isStartRange: isStartRange,
                    isEndRange: isEndRange,
                    isInRange: isInRange,
                    showDaysInNextAndPreviousMonths: opts.showDaysInNextAndPreviousMonths
                };

                row.push(this.renderDay(dayConfig));

                if (++r === 7) {
                    data.push(this.renderRow(row, opts.isRTL, isWeekSelected));
                    row = [];
                    r = 0;
                    isWeekSelected = false;
                }
            }
            return this.renderTable(opts, data, randId);
        }

        this.renderDay = function(opts) {
            let arr = [];
            let ariaSelected = 'false';
            if (opts.isEmpty) {
                if (opts.showDaysInNextAndPreviousMonths) {
                    arr.push('is-outside-current-month');
                    arr.push('is-selection-disabled');
                } else {
                    return '<td class="is-empty"></td>';
                }
            }
            if (opts.isDisabled) {
                arr.push('is-disabled');
            }

            if (opts.isToday) {
                arr.push('is-today');
            }
            if (opts.isSelected) {
                arr.push('is-selected');
                ariaSelected = 'true';
            }
            if (opts.hasEvent) {
                arr.push('has-event');
            }
            if (opts.isInRange) {
                arr.push('is-inrange');
            }
            if (opts.isStartRange) {
                arr.push('is-startrange');
            }
            if (opts.isEndRange) {
                arr.push('is-endrange');
            }
            return (
                `<td data-day="${opts.day}" class="${arr.join(' ')}" aria-selected="${ariaSelected}">` +
                `<button class="datepicker-day-button" type="button" data-year="${opts.year}" data-month="${
                    opts.month
                }" data-day="${opts.day}">${opts.day}</button>` +
                '</td>'
            );
        }

        this.renderRow = function(days, isRTL, isRowSelected) {
            return (
                '<tr class="datepicker-row' +
                (isRowSelected ? ' is-selected' : '') +
                '">' +
                (isRTL ? days.reverse() : days).join('') +
                '</tr>'
            );
        }

        this.renderTable = function(opts, data, randId) {
            return (
                '<div class="datepicker-table-wrapper"><table cellpadding="0" cellspacing="0" class="datepicker-table" role="grid" aria-labelledby="' +
                randId +
                '">' +
                this.renderHead(opts) +
                this.renderBody(data) +
                '</table></div>'
            );
        }

        this.renderHead = function(opts) {
            let i,
                arr = [];
            for (i = 0; i < 7; i++) {
                arr.push(
                    `<th scope="col"><abbr title="${this.renderDayName(opts, i)}">${this.renderDayName(
                        opts,
                        i,
                        true
                    )}</abbr></th>`
                );
            }
            return '<thead><tr>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</tr></thead>';
        }

        this.renderBody = function(rows) {
            return '<tbody>' + rows.join('') + '</tbody>';
        }

        this.renderTitle = function(instance, c, year, month, refYear, randId) {
            let i,
                j,
                arr,
                opts = this.options,
                isMinYear = year === opts.minYear,
                isMaxYear = year === opts.maxYear,
                html =
                    '<div id="' +
                    randId +
                    '" class="datepicker-controls" role="heading" aria-live="assertive">',
                monthHtml,
                yearHtml,
                prev = true,
                next = true;

            for (arr = [], i = 0; i < 12; i++) {
                arr.push(
                    '<option value="' +
                    (year === refYear ? i - c : 12 + i - c) +
                    '"' +
                    (i === month ? ' selected="selected"' : '') +
                    ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth)
                        ? 'disabled="disabled"'
                        : '') +
                    '>' +
                    opts.i18n.months[i] +
                    '</option>'
                );
            }

            monthHtml =
                '<select class="datepicker-select orig-select-month custom-select" tabindex="-1">' +
                arr.join('') +
                '</select>';

            if ($.isArray(opts.yearRange)) {
                i = opts.yearRange[0];
                j = opts.yearRange[1] + 1;
            } else {
                i = year - opts.yearRange;
                j = 1 + year + opts.yearRange;
            }

            for (arr = []; i < j && i <= opts.maxYear; i++) {
                if (i >= opts.minYear) {
                    arr.push(`<option value="${i}" ${i === year ? 'selected="selected"' : ''}>${i}</option>`);
                }
            }

            yearHtml = `<select class="datepicker-select orig-select-year custom-select" tabindex="-1">${arr.join(
                ''
            )}</select>`;

            let leftArrow =
                '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"/><path d="M0-.5h24v24H0z" fill="none"/></svg>';
            html += `<button class="month-prev${
                prev ? '' : ' is-disabled'
            }" type="button">${leftArrow}</button>`;

            html += '<div class="selects-container input-group">';
            if (opts.showMonthAfterYear) {
                html += yearHtml + monthHtml;
            } else {
                html += monthHtml + yearHtml;
            }
            html += '</div>';

            if (isMinYear && (month === 0 || opts.minMonth >= month)) {
                prev = false;
            }

            if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
                next = false;
            }

            let rightArrow =
                '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/><path d="M0-.25h24v24H0z" fill="none"/></svg>';
            html += `<button class="month-next${
                next ? '' : ' is-disabled'
            }" type="button">${rightArrow}</button>`;

            return (html += '</div>');
        }

        /**
         * refresh the HTML
         */
        this.draw = function(force) {
            if (!this.isOpen && !force) {
                return;
            }
            let opts = this.options,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth,
                html = '',
                randId;

            if (this._y <= minYear) {
                this._y = minYear;
                if (!isNaN(minMonth) && this._m < minMonth) {
                    this._m = minMonth;
                }
            }
            if (this._y >= maxYear) {
                this._y = maxYear;
                if (!isNaN(maxMonth) && this._m > maxMonth) {
                    this._m = maxMonth;
                }
            }

            randId =
                'datepicker-title-' +
                Math.random()
                    .toString(36)
                    .replace(/[^a-z]+/g, '')
                    .substr(0, 2);

            for (let c = 0; c < 1; c++) {
                this._renderDateDisplay();
                html +=
                    this.renderTitle(
                        this,
                        c,
                        this.calendars[c].year,
                        this.calendars[c].month,
                        this.calendars[0].year,
                        randId
                    ) + this.render(this.calendars[c].year, this.calendars[c].month, randId);
            }

            this.calendarEl.innerHTML = html;

            // Init Materialize Select
            let yearSelect = this.calendarEl.querySelector('.orig-select-year');
            let monthSelect = this.calendarEl.querySelector('.orig-select-month');
            // M.FormSelect.init(yearSelect, {
            //     classes: 'select-year',
            //     dropdownOptions: { container: document.body, constrainWidth: false }
            // });
            // M.FormSelect.init(monthSelect, {
            //     classes: 'select-month',
            //     dropdownOptions: { container: document.body, constrainWidth: false }
            // });

            // Add change handlers for select
            yearSelect.addEventListener('change', handlers._handleYearChange.bind(this));
            monthSelect.addEventListener('change', handlers._handleMonthChange.bind(this));

            if (typeof this.options.onDraw === 'function') {
                this.options.onDraw(this);
            }
        }

        this._renderDateDisplay = function() {
            let displayDate = window.Skyline.DatePicker._isDate(this.date) ? this.date : new Date();

            this.yearTextEl.innerHTML = displayDate.getFullYear();
            this.dateTextEl.innerHTML = this.formatDate(displayDate, this.options.displayFormat);
        }

        if (!this.options.defaultDate) {
            this.options.defaultDate = new Date(Date.parse(this.el.value));
        }

        let defDate = this.options.defaultDate;
        if (window.Skyline.DatePicker._isDate(defDate)) {
            if (this.options.setDefaultDate) {
                this.setDate(defDate, true);
                this.setInputValue();
            } else {
                this.gotoDate(defDate);
            }
        } else {
            this.gotoDate(new Date());
        }

        /**
         * Describes open/close state of datepicker
         * @type {Boolean}
         */
        this.isOpen = false;
    }

    window.Skyline.DatePicker.Parser = {
        standard: function(value, fmt) {
            let p;
            if((p = /^\s*(\d+)\s*([\/\-.])\s*(\d+)\s*(?:([\/\-.])\s*(\d+)|)\s*$/.exec(value))) {
                if(!p[5])
                    p[5] = (new Date()).getFullYear();

                if(p[2] == '-' || p[2] == '/') // YY[YY] MM DD
                    return new Date(p[1], p[3] -1, p[5]);
                return new Date(p[5], p[3]-1, p[1]);
            }
        },
        lingual: function(value, fmt, picker) {
            let d=0,MM=0,y=0;

            let parts = value.split(/(\d+|\w+)/g).map(function(v) {
                let m = picker.options.i18n.months.indexOf(v);
                if(m > -1)
                    return (MM= m)?"":"";

                m = picker.options.i18n.monthsShort.indexOf(v);
                if(m > -1)
                    return (MM = m) ? "" : "";

                if(isNaN(v))
                    return "";
                return v;
            });


            parts.forEach(function(e) {
                let n=e*1;
                if(!n)
                    return;

                if(n>100)
                    return y=n;
                d=n;
            })
            if(d&&MM&&y)
                return new Date(y, MM, d);

            throw new Error("Can not parse date string");
        },
        all: function(value, fmt, picker) {
            let date=false;

            try {
                date = window.Skyline.DatePicker.Parser.lingual(value, fmt, picker);
            } catch (e) {
                date = false;
            }
            if(!Skyline.DatePicker._isDate(date))
                date = window.Skyline.DatePicker.Parser.standard(value, fmt);
            if(Skyline.DatePicker._isDate(date))
                return date;
            throw new Error("Can not parse date string");
        }
    };

    $.fn.datepicker = function(action, options) {
        $(this).each(function() {
            if(!this.Sky_Datepicker)
                this.Sky_Datepicker = new window.Skyline.DatePicker(this, options);
        });

        var PK = this[0].Sky_Datepicker;
        if(action == 'open')
            PK.open();
        if(action == 'instance')
            return PK;
        if(action==='update')
            PK._handleInputChangeBound(false);
        return this;
    };
})(jQuery);