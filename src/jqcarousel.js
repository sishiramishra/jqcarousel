/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
* jslint nomen: true, indent: 4, maxerr: 50
* @name jQCarousel
* @version 1.0.3
* @author Minko Gechev
* @date 2012-02-11
*
* @license GPL
*
* @description
*   jQuery plugin creating carousel gallery.
*
*
* @usage
*   $('#gallery').jqcarousel({ focus: x, eccentricity: y, animationDuration: z, opacity: k, minOpacity: i, direction: j, resize: m, minSizeRatio: n, angle: v, keyboardNavigation: u });
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

(function ($) {

    'use strict';

    $.widget('ui.jqcarousel', {

        options: {
            eccentricity: 0.99,
            focus: 300,
            animationDuration: 700,
            opacity: true,
            resize: true,
            angle: 0,
            minOpacity: 0.2,
            minSizeRatio: 0.3,
            keyboardNavigation: true,
            direction: 'shortest'
        },

        destroy: function () {
            this._removeEventListeners();
            this.element.remove();
        },

        _settings: {
            images: [],
            a: 0,
            b: 0,
            activeAnimation: 0,
            current: 0,
            stepDuration: 25,
            sizeBackup: []
        },

        _create: function () {
            this._render();
            this._sizeBackup();
            this._performLayout();
            this._removeEventHandlers();
            this._addEventHandlers();
        },

        _render: function () {
            var image,
                images = $(this.element.children()),
                count = 0,
                settings = this._settings;
            this._calculateEllipse();
            images.each(function (index) {
                image = {
                    image: $(images[index])
                };
                settings.images.push(image);
                count += 1;
            });
            this._settings.count = count;
        },

        _calculateEllipse: function () {
            var settings = this._settings,
                options = this.options;
            settings.a = options.focus / options.eccentricity;
            settings.b = Math.sqrt(settings.a * settings.a - options.focus * options.focus);
        },

        _sizeBackup: function () {
            var images = this._settings.images,
                i = images.length,
                width,
                height;
            while (i) {
                i -= 1;
                width = images[i].image.width();
                height = images[i].image.height();
                this._settings.sizeBackup[i] = {
                    width: width,
                    ratio: height / width
                };
            }
        },

        _performLayout: function () {
            this._performHostLayout();
            this._performImagesLayout();
        },

        _performHostLayout: function () {
            this.element.width(1);
            this.element.height(1);
            this.element.css('overflow', 'visible');
            this.element.css('position', 'relative');
        },

        _performImagesLayout: function () {
            var settings = this._settings,
                angle = Math.PI / 2,
                images = settings.images,
                image = null,
                i = images.length,
                step = (2 * Math.PI) / i;
            settings.current = i - 1;
            while (i) {
                i -= 1;
                image = images[i].image;
                image[0].style.position = 'absolute';
                this._setImagePosition(image, angle);
                images[i].angle = angle;
                this._handlePerspective(images[i], i);
                angle += step;
            }
        },

        _setImagePosition: function (image, angle) {
            var settings = this._settings,
                tempLeft = settings.a * Math.cos(angle) + settings.a,
                tempTop = settings.b * Math.sin(angle) + settings.b,
                left = tempLeft,
                top = tempTop,
                rotationAngle = this.options.angle;
            if (rotationAngle) {
                left = Math.cos(rotationAngle) * tempLeft - Math.sin(rotationAngle) * tempTop;
                top = Math.sin(rotationAngle) * tempLeft + Math.cos(rotationAngle) * tempTop;
            }
            image[0].style.left = left + 'px';
            image[0].style.top = top + 'px';
        },

        _removeEventHandlers: function () {
            var count = this._settings.images.length,
                images = this._settings.images;
            while (count) {
                count -= 1;
                images[count].image.off();
            }
            $(document).off();
        },

        _addEventHandlers: function () {
            var images = this._settings.images,
                i = images.length,
                image = null;
            while (i) {
                i -= 1;
                image = images[i].image;
                this._addMouseHandlers(image, i);
            }
            $(document).on('keydown', { self: this }, this._addKeyboardHandler);
        },

        _addMouseHandlers: function (image, index) {
            var self = this;
            image.on('click', function () {
                if (!self._settings.activeAnimation) {
                    self.showFront(index);
                }
            });
        },

        _addKeyboardHandler: function (event) {
            var self = event.data.self;
            if (self.options.keyboardNavigation) {
                if (event.keyCode === 39) {
                    self.rotateLeft();
                } else if (event.keyCode === 37) {
                    self.rotateRight();
                }
            }
        },

        _moveImage: function (image, step, stepsCount, target, index) {
            var self = this;
            if (stepsCount > 0) {
                image.angle += step;
                setTimeout(function () {
                    self._moveImage(image, step, stepsCount - 1, target, index);
                }, this._settings.stepDuration);
            } else {
                this._finishImageMovement(target, image);
            }
            this._handlePerspective(image, index);
            this._setImagePosition(image.image, image.angle);
        },

        _finishImageMovement: function (target, image) {
            if (target < 0) {
                while (target < 0) {
                    target += Math.PI * 2;
                }
            }
            image.angle = target;
            image.angle %= Math.PI * 2;
            this._settings.activeAnimation -= 1;
        },

        _handlePerspective: function (image, index) {
            var zIndex = Math.round(Math.sin(image.angle) * 1000),
                imageElement = image.image,
                ratio = (zIndex + 1000) / 2000;
            imageElement[0].style.zIndex = zIndex;
            this._handleOpacity(imageElement, ratio + this.options.minOpacity);
            this._handleSize(imageElement, index, ratio + this.options.minSizeRatio);
        },

        _handleOpacity: function (image, opacity) {
            if (this.options.opacity) {
                if (opacity > 1) {
                    opacity = 1;
                } else if (opacity < 0) {
                    opacity = 0;
                }
                image[0].style.opacity = opacity;
            }
        },

        _handleSize: function (image, index, ratio) {
            if (this.options.resize) {
                ratio = (ratio > 1) ? 1 : ratio;
                var size = this._settings.sizeBackup[index],
                    newWidth = size.width * ratio,
                    newHeight = newWidth * size.ratio;
                image[0].style.width = newWidth + 'px';
                image[0].style.height = newHeight + 'px';
            }
        },

        _getDistance: function (source, target, direction) {
            if (source === target) {
                return 0;
            }
            direction = direction || this.options.direction;
            switch (direction) {
            case 'cw':
                return this._getCWDistance(source, target);
            case 'ccw':
                return this._getCCWDistance(source, target);
            case 'shortest':
                var ccwDistance = Math.abs(this._getCCWDistance(source, target)),
                    cwDistance = this._getCWDistance(source, target);
                if (cwDistance < ccwDistance) {
                    return cwDistance;
                } else {
                    return -ccwDistance;
                }
            }
            return 0;
        },

        _getCWDistance: function (source, target) {
            var tempDistance,
                distance = 0;
            tempDistance = Math.abs(source - target) % (2 * Math.PI);
            if (Math.cos(source) < 0) {
                distance = Math.max((2 * Math.PI) - tempDistance, tempDistance);
            } else {
                distance = Math.min((2 * Math.PI) - tempDistance, tempDistance);
            }
            return distance;
        },

        _getCCWDistance: function (source, target) {
            var tempDistance,
                distance = 0;
            tempDistance = Math.abs(source - target) % (2 * Math.PI);
            if (Math.cos(source) > 0) {
                distance = Math.max((2 * Math.PI) - tempDistance, tempDistance);
            } else {
                distance = Math.min((2 * Math.PI) - tempDistance, tempDistance);
            }
            return -distance;
        },

        showFront: function (index, duration, direction) {
            var animationDuration =
                    typeof duration === 'undefined' ? this.options.animationDuration : duration,
                images = this._settings.images,
                image = this._settings.images[index],
                i = images.length,
                distance = this._getDistance(image.angle, Math.PI / 2, direction),
                steps = animationDuration / this._settings.stepDuration,
                step = distance / steps;
            this._settings.current = index;
            direction = direction || this.options.direction;
            if (distance !== 0) {
                while (i) {
                    i -= 1;
                    this._settings.activeAnimation += 1;
                    image = this._settings.images[i];
                    this._moveImage(image, step, steps, images[i].angle + distance, i);
                }
            }
        },

        rotateRight: function (duration) {
            if (typeof duration === 'undefined') {
                duration = this.options.animationDuration;
            }
            var settings = this._settings;
            if (!this._settings.activeAnimation) {
                this.showFront((settings.current + 1) % settings.images.length, duration, 'cw');
            }
        },

        rotateLeft: function (duration) {
            if (typeof duration === 'undefined') {
                duration = this.options.animationDuration;
            }
            var settings = this._settings,
                next = settings.current - 1;
            if (next < 0) {
                next = settings.images.length - 1;
            }
            if (!this._settings.activeAnimation) {
                this.showFront(next, duration, 'ccw');
            }
        }

    });
}(jQuery));