/*

    Not sure this is at all viable, what I really want is something that recognisably plays patterns (such as those on
    the Roland MC-303 IN REVERSE).  One approach would be to use song pointer positions, i.e. every beat go backwards
    and then play a single note from the current position.  My first question is, what happens when we go to a very high
    song position in a song that has very few steps.  Is it like deep space, just silence?

    One strategy for playing backwards is to move backwards by two steps every step.  Does that result in a note being
    played?  Try it.  If so, then you just need to send the clock messages for each step, and increase the rate.

    What happens for positive time?  Move the beat forward by one and send a clock message.

 */
(function (fluid, flock){
    "use strict";
    fluid.defaults("agamidi", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            "midiInput":  ".midi-input",
            "midiOutput": ".midi-output",
            "clockDelta": ".clock-delta", // TODO: Make something to display the delta.
            "beat":        ".beat" // TODO: Make something to display the beat.
        },
        maxBeat: 16384, // TODO: Experiment with this.
        members: {
            beatIsStale: false
        },
        model: {
            delta: 0,
            beat: 0,
            timeScale: 1
        },
        preferredInputDevice:    "UM-ONE",
        preferredOutputDevice: "Beatstep (White) Arturia BeatStep",
        invokers: {
            handleControl: {
                funcName: "agamidi.handleControl",
                args: ["{that}", "{arguments}.0"] // midiMessage
            },
            handleBeat: {
                funcName: "agamidi.handleBeat",
                args: ["{that}"]
            }
        },
        components: {
            enviro: {
                type: "flock.enviro"
            },
            scheduler: {
                type: "berg.scheduler",
                options: {
                    components: {
                        clock: {
                            type: "berg.clock.raf",
                            options: {
                                freq: 3
                            }
                        }
                    },
                    listeners: {
                        "onCreate.schedulePolling": {
                            func: "{that}.schedule",
                            args: [{
                                type: "repeat",
                                freq: 1,
                                callback: "{agamidi}.handleBeat"
                            }]
                        }
                    }
                }
            },
            midiInput: {
                type: "flock.auto.ui.midiConnector",
                container: "{that}.dom.midiInput",
                options: {
                    preferredDevice: "{agamidi}.options.preferredInputDevice",
                    portType: "input",
                    components: {
                        midiPortSelector: {
                            options: {
                                strings: {
                                    selectBoxLabel: "MIDI Input",
                                }
                            }
                        }
                    },
                    listeners: {
                        "control.handleControl": {
                            func: "{agamidi}.handleControl",
                            args: ["{arguments}.0"]
                        }
                    }
                }
            },
            midiOutput: {
                type: "flock.auto.ui.midiConnector",
                container: "{that}.dom.midiOutput",
                options: {
                    preferredDevice: "{agamidi}.options.preferredOutputDevice",
                    portType: "output",
                    components: {
                        midiPortSelector: {
                            options: {
                                strings: {
                                    selectBoxLabel: "MIDI Output",
                                }
                            }
                        }
                    }
                }
            },
            oda: {
                type: "agamidi.oda",
                container: ".oda",
                options: {
                    model: {
                        deflection: "{agamidi}.model.delta"
                    }
                }
            }
        },
        modelListeners: {
            delta: {
                excludeSource: "init",
                funcName: "agamidi.deltaToStartStop",
                args: ["{that}", "{change}.value", "{change}.oldValue"] // newValue, oldValue
            },
            timeScale: {
                excludeSource: "init",
                funcName: "agamidi.changeTimeScale",
                args: ["{that}", "{arguments}.0"] // that, timeScale
            }
        }
    });

    agamidi.handleControl = function (that, midiMessage) {
        // The range is -1 to 1, with rounding to 1/25 to cut down on jitter.
        var newDelta = Math.round(((midiMessage.value - 64)/64) * 25)/25;
        that.applier.change("delta", newDelta);
    };

    // Function to send clock messages to MIDI output.
    agamidi.handleBeat = function (that) {
        if (!that.beatIsStale) {
            // TODO: Shouldn't this be 2 for -1?
            var increment = that.model.delta >= 0 ? 1 : -1;
            var newBeat = (that.options.maxBeat + that.model.beat + increment) % that.options.maxBeat;

            that.applier.change("beat", newBeat);

            var connection = fluid.get(that, "midiOutput.connection");
            if (connection) {
                // https://github.com/colinbdclark/Flocking/blob/2201ee835e6a21efe9079a19b7c3f6b3dd1b4187/tests/unit/js/midi-tests.js#L288
                connection.send({
                    type: "songPointer",
                    value: newBeat
                });

                connection.send({
                    type: "clock"
                });
            }
        }
    };

    agamidi.deltaToStartStop = function (that, newValue, oldValue) {
        var connection = fluid.get(that, "midiOutput.connection");
        // Stop the clock.
        if (newValue === 0) {
            that.scheduler.stop();
            if (connection) {
                connection.send({ type: "stop" });
            }
        }
        // Start (continue?) the clock.
        else if (oldValue === 0) {
            that.scheduler.start();
            if (connection) {
                connection.send({ type: "continue" });
            }
        }

        var timeScale = 0.2 + (0.8 - (0.8 * Math.abs(newValue)));
        that.applier.change("timeScale", timeScale);
    };

    agamidi.changeTimeScale = function (that, timeScale) {
        that.scheduler.setTimeScale(timeScale);
    };
})(fluid, flock);

