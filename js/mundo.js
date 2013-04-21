/* Cosas para dibujar el canvas del mundo */

function paint(context, mundo, mundo_ancho, mundo_alto) {

    var primera_fila = 1
    var primera_columna = 1

    function dibuja_karel(origen){ //Dibujar a Karel
        context.fillStyle = '#0000FF'
        if (mundo.orientado_al('norte')) {
            context.moveTo ( origen.x, origen.y+13 )
            context.lineTo ( origen.x+15, origen.y )
            context.lineTo ( origen.x+30, origen.y+13 )
            context.lineTo ( origen.x+23, origen.y+13 )
            context.lineTo ( origen.x+23, origen.y+27 )
            context.lineTo ( origen.x+7, origen.y+27 )
            context.lineTo ( origen.x+7, origen.y+13 )
            context.closePath ()
            context.fill()
        } else if (mundo.orientado_al('este')) {
            context.moveTo ( origen.x+3, origen.y+7 )
            context.lineTo ( origen.x+17, origen.y+7 )
            context.lineTo ( origen.x+17, origen.y )
            context.lineTo ( origen.x+30, origen.y+15 )
            context.lineTo ( origen.x+17, origen.y+30 )
            context.lineTo ( origen.x+17, origen.y+23 )
            context.lineTo ( origen.x+3, origen.y+23 )
            context.closePath ()
            context.fill()
        } else if (mundo.orientado_al('sur')) {
            context.moveTo ( origen.x+7, origen.y+3 )
            context.lineTo ( origen.x+23, origen.y+3 )
            context.lineTo ( origen.x+23, origen.y+17 )
            context.lineTo ( origen.x+30, origen.y+17 )
            context.lineTo ( origen.x+15, origen.y+30 )
            context.lineTo ( origen.x, origen.y+17)
            context.lineTo ( origen.x+7, origen.y+17)
            context.closePath()
            context.fill()
        } else if (mundo.orientado_al('oeste')) {
            context.moveTo( origen.x, origen.y+15 )
            context.lineTo( origen.x+13, origen.y )
            context.lineTo( origen.x+13, origen.y+7 )
            context.lineTo( origen.x+27, origen.y+7 )
            context.lineTo( origen.x+27, origen.y+23 )
            context.lineTo( origen.x+13, origen.y+23 )
            context.lineTo( origen.x+13, origen.y+30 )
            context.closePath()
            context.fill()
        }
    }

    context.fillStyle="#959595";
    context.fillRect(0, 0, mundo_ancho, mundo_alto)
    //context.fill()

    var tamanio_lienzo = {x:(mundo_ancho-30), y:(mundo_alto-30)}
    var tamanio_mundo = {x:mundo_ancho, y:mundo_alto}

    context.fillStyle="#FFFFFF"
    context.fillRect(30, 0, tamanio_lienzo.x, tamanio_lienzo.y)
    //context.fill()

    //IMPORTANTE
    var origen = {x:30, y:mundo_alto-60} //Coordenada para dibujar la primera casilla

    var num_columnas = (tamanio_lienzo.x/30 + Math.ceil((tamanio_lienzo.x%30)/30.))*1
    var num_filas = (tamanio_lienzo.y/30 + Math.ceil((tamanio_lienzo.y%30)/30.))*1
    //Cuadrados de las esquinas
    for(var i=0;i<num_columnas;i++){
        for(j=0;j<num_columnas;j++) {
            x = origen.x+30*i
            y = origen.y-30*j
            context.fillStyle="#656565";
            context.fillRect(x-2, y+26, 6, 6)
            //context.fill()
        }
    }

    //Dibujar las cosas que pertenecen al mundo por cada casilla
    num_fila = 1 //Posicion relativa a la pantalla
    num_columna = 1 //Posicion relativa a la pantalla
    //for fila in xrange(primera_fila, primera_fila+num_filas):
    for(var fila=primera_fila;fila<(primera_fila+num_filas);fila++){
        num_columna = 1
        //for columna in xrange(primera_columna, primera_columna+num_columnas):
        for(var columna=primera_columna;columna<primera_columna+num_columnas;columna++){
            casilla = mundo.obten_casilla([fila, columna]) //Casilla actual

            //Dibujar a karel
            if (mundo.posicion_karel()[0] == fila && mundo.posicion_karel()[1] == columna) {
                var referencia = {x: origen.x+(num_columna-1)*30, y: origen.y-(num_fila-1)*30}
                dibuja_karel(referencia)
            }

            //Paredes
            context.fillStyle="#191919";
            if (casilla['paredes'].indexOf('este') != -1) {
                context.fillRect(origen.x+(num_columna-1)*30-1+30, origen.y-(num_fila-1)*30, 4, 30)
                //context.fill()
            }
            if (casilla['paredes'].indexOf('oeste') != -1) {
                context.fillRect(origen.x+(num_columna-1)*30-1, origen.y-(num_fila-1)*30, 4, 30)
                //context.fill()
            }
            if (casilla['paredes'].indexOf('sur') != -1) {
                context.fillRect(origen.x+(num_columna-1)*30+1, origen.y-(num_fila-1)*30+27, 30, 4)
                //context.fill()
            }
            if (casilla['paredes'].indexOf('norte') != -1) {
                context.fillRect(origen.x+(num_columna-1)*30+1, origen.y-(num_fila-1)*30+27-30, 30, 4)
                //context.fill()
            }

            //Zumbadores
            if (casilla['zumbadores'] == -1 || casilla['zumbadores']>0) {
                if (casilla['zumbadores'] == -1) {
                    context.set_source_rgb(0, 1, 0)
                    context.fillRect(origen.x+(num_columna-1)*30+8, origen.y-(num_fila-1)*30+8, 16, 12)
                    //context.fill()

                    context.select_font_face('monospace')
                    context.set_font_size(25)
                    context.moveTo(origen.x+(num_columna-1)*30+9, origen.y-(num_fila-1)*30+23)
                    context.set_source_rgb(0, 0, 0)
                    context.show_text('∞')
                } else if (casilla['zumbadores'] < 10) {
                    context.set_source_rgb(0, 1, 0)
                    context.fillRect(origen.x+(num_columna-1)*30+9, origen.y-(num_fila-1)*30+8, 12, 14)
                    //context.fill()

                    context.select_font_face('monospace')
                    context.set_font_size(12)
                    context.moveTo(origen.x+(num_columna-1)*30+11, origen.y-(num_fila-1)*30+20)
                    context.set_source_rgb(0, 0, 0)
                    context.show_text(str(casilla['zumbadores']))
                } else {
                    context.set_source_rgb(0, 1, 0)
                    context.fillRect(origen.x+(num_columna-1)*30+7, origen.y-(num_fila-1)*30+8, 16, 14)
                    //context.fill()

                    context.select_font_face('monospace')
                    context.set_font_size(12)
                    context.moveTo(origen.x+(num_columna-1)*30+8, origen.y-(num_fila-1)*30+20)
                    context.set_source_rgb(0, 0, 0)
                    context.show_text(str(casilla['zumbadores']))
                }
            }
            num_columna += 1
        }
        num_fila += 1
    }
    //Numeros de fila
    var a = 1
    for (i=primera_fila;i<primera_fila+num_filas;i++){
        context.font = "14px monospace"
        context.fillStyle = '#000000'
        context.fillText(""+i,10, mundo_alto-(10+a*30));
        a += 1
    }

    //Numeros de colummna
    a = 1
    for(i=primera_columna;i<primera_columna+num_columnas;i++){
        context.font = '14px monospace'
        context.fillStyle = '#000000'
        context.fillText(""+i,10+30*a, mundo_alto-10);
        a += 1
    }

    //Pad de control
    //~ context.fillStyle = '#305881'
//~
    //~ context.moveTo(tamanio_mundo.x-70+35, 5)
    //~ context.lineTo(tamanio_mundo.x-70+69, 5+55)
    //~ context.lineTo(tamanio_mundo.x-70+35, 5+110)
    //~ context.lineTo(tamanio_mundo.x-70+1, 5+55)
    //~ context.closePath()
    //context.fill()


    //Controles de movimiento
    //~ context.fillStyle = '#60b151'
    //~ context.moveTo(mundo_ancho-40-10, 40)
    //~ context.lineTo(mundo_ancho-10-10, 40)
    //~ context.lineTo(mundo_ancho-25-10, 10)
    //~ context.closePath()
    //context.fill()

    //~ context.moveTo(mundo_ancho-40-10, 10+70) //Sur
    //~ context.lineTo(mundo_ancho-10-10, 10+70)
    //~ context.lineTo(mundo_ancho-25-10, 40+70)
    //~ context.closePath()
    //context.fill()

    //~ context.moveTo(mundo_ancho-25-8, 45) //Este
    //~ context.lineTo(mundo_ancho-25+30-8, 45+15)
    //~ context.lineTo(mundo_ancho-25-8, 45+30)
    //~ context.closePath()
    //context.fill()

    //~ context.moveTo(mundo_ancho-25-50+30+8, 45) //Oeste
    //~ context.lineTo(mundo_ancho-25-50+8, 45+15)
    //~ context.lineTo(mundo_ancho-25-50+30+8, 45+30)
    //~ context.closePath()
    //context.fill()

    //Actualizamos el indicador de zumbadores
    //~ if (mundo.obten_mochila() == -1)
        //~ builder.get_object('inf_beeperbag_toggle').set_active(True)
    //~ else
        //~ builder.get_object('mochila_entry').set_text(str(mundo.obten_mochila()))
}
