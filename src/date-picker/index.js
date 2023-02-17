
import $ from "../jquery";
import {_defaults} from "./defaults";

export class DatePicker {
    static get defaults() { return _defaults; }

    constructor(el, options) {
        this.id = window.Skyline.guid();

        this.$el = $(el);
        this.options = Object.assign({}, _defaults, options);
        if (!!options && options.hasOwnProperty('i18n') && typeof options.i18n === 'object') {
            this.options.i18n = Object.assign({}, _defaults.i18n, options.i18n);
        }


    }

    static isDate(date) {
        return /Date/.test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    }

    static isWeekend(date) {
        let day = date.getDay();
        return day === 0 || day === 6;
    }

    static setToStartOfDay(date) {
        if (DatePicker.isDate(date)) date.setHours(0, 0, 0, 0);
    }

    static isLeapYear(year) {
        // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    static getDaysInMonth(year, month) {
        return [31, DatePicker.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
            month
            ];
    }

    static compareDates(a, b) {
        // weak date comparison (use setToStartOfDay(date) to ensure correct result)
        return a.getTime() === b.getTime();
    }
}
