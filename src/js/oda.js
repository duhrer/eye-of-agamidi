(function (fluid, flock, $) {
    "use strict";
    fluid.defaults("agamidi.oda", {
        gradeNames: ["fluid.viewComponent"],
        svgData: flock.midi.interchange.svg.agamidi_oda,
        model: {
            deflection: 0 // -1 (hard reverse) -> 0 (stopped) -> 1 (hard forward)
        },
        modelListeners: {
            deflection: {
                funcName: "agamidi.oda.displayDeflection",
                args: ["{that}", "{change}.value"] // newValue
            }
        },
        listeners: {
            "onCreate.init": {
                funcName: "agamidi.oda.init",
                args: ["{that}"]
            }
        }
    });

    agamidi.oda.init = function (that) {
        // Render our SVG content.
        that.container.html(that.options.svgData);
    };

    agamidi.oda.displayDeflection = function (that, newValue) {
        var auraElement = $(that.container).find("#aura");
        if (newValue === 0) {
            auraElement.removeClass("clockwise");
            auraElement.removeClass("counterclockwise");
        }
        else if (newValue < 0) {
            auraElement.removeClass("clockwise");
            auraElement.addClass("counterclockwise");
        }
        else {
            auraElement.addClass("clockwise");
            auraElement.removeClass("counterclockwise");
        }
        var opacity = newValue === 0 ? 0 : (Math.abs(newValue) + 1)/2;
        auraElement.css("opacity", opacity);
        auraElement.css("stroke-width", Math.ceil(opacity * 10))
        auraElement.css("animation-duration", (2/opacity) + "s")
    };
})(fluid, flock, jQuery);
