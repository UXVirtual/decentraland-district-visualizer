AFRAME.registerSystem('main', {

    /* COMPONENT PROPERTIES */

    schema: {
    },  // System schema. Parses into `this.data`.

    /* INTERNAL PROPERTIES */

    init: function () {
        /*var mappings = {
            default: {
                'vive-controls': {
                    trackpaddown: 'aim',
                    trackpadup: 'teleport'
                },

                'oculus-touch-controls': {
                    triggerdown: 'aim',
                    triggerup: 'teleport'
                }
            }
        };

        AFRAME.registerInputMappings(mappings);

        */

        this.el.addEventListener('loaded', function() {
            const lightEls = document.querySelectorAll('[light]');
            for (const light in lightEls) {
                if(lightEls.hasOwnProperty(light)){
                    if (lightEls[light].getAttribute('light')['type'] !== 'hemisphere') {
                        lightEls[light].setAttribute('light',{
                            shadowCameraVisible: true,
                            castShadow: true
                        });
                    }
                }
            }
        });
    }
});

