/*
El analizador léxico de Karel completamente reescrito por mi para la
sintaxis pascal
*/

function _in(a, sec){
    /* Determina cuando a está en la secuencia o el arreglo */
    if(sec.indexOf(a) == -1)
        return false;
    return true;
}

function tokenizar(cadena){
    /*analizador léxico de karel*/
    ESTADO_ESPACIO = ' ';
    ESTADO_PALABRA = 'a'
    ESTADO_COMENTARIO = '//'
    ESTADO_NUMERO = '0'
    ESTADO_SIMBOLO = '+'

    numeros = "0123456789"
    palabras = "abcdfeghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-"
    simbolos = "(){}*/;," //Simbolos permitidos para esta sintaxis
    espacios = " \n\r\t"

    caracteres = numeros+palabras+simbolos+espacios

    ultimo_caracter = ''
    caracter_actual = ''
    abrir_comentario = '' //Indica cómo fue abierto un comentario

    pila_tokens = [] //Pila de tokens por si me lo devuelven
    pila_chars = [] //Pila de caracteres
    char_pushed = false //Indica cuando un caracter ha sido puesto en la pila

    linea = 1 //El número de linea
    columna = 0//El número de columna
    tiene_cambio_de_linea = false
    token = ''
    estado = ESTADO_ESPACIO

    lee_caracter = function(){
        /*Lee un caracter de la fuente o devuelve uno de la pila si no
        está vacía*/
        if (len(pila_chars)!=0){
            return pila_chars.pop();
        } else {
            ultimo_caracter = caracter_actual;
            return archivo.read(1);
        }
    }

    get_token = function(){
        /*Obtiene el siguiente token. Si la pila tiene tokens le quita
        uno, si no, obtiene el siguiente token del archivo*/
        if (len(pila_tokens)>0){
            return pila_tokens.pop();
        }else{
            return lee_token();
        }
    }

    push_token = function( token){
        /*Empuja un token en la pila*/
        pila_tokens.push(token);
    }

    push_char = function( char){
        /*Pone un caracter en la pila de caracteres*/
        pila_chars.push(char);
        char_pushed = true;
    }

    resultado = [];
    i = 0;
    salida = false;

    while(true){
        /*Lee un token del archivo*/
        while(true){
            caracter_actual = cadena.charAt(i);
            columna += 1
            if( i == cadena.length){
                salida = true;
                break;
            }
            if (tiene_cambio_de_linea){
                linea += 1
                columna = 0
                tiene_cambio_de_linea = false;
            }
            if (estado == ESTADO_COMENTARIO){
                if (caracter_actual in simbolos){ //Lo que puede pasar es que sea basura o termine el comentario
                    if (caracter_actual == ')' && abrir_comentario == '(*' && ultimo_caracter == '*'){
                        estado = ESTADO_ESPACIO
                    }
                    if (caracter_actual == '}' && abrir_comentario == '{'){
                        estado = ESTADO_ESPACIO
                    }
                }else if( caracter_actual == '\n'){
                    tiene_cambio_de_linea = true;
                }
            }else if( estado == ESTADO_ESPACIO){
                if (! _in(caracter_actual, caracteres))
                    throw KarelException("Caracter desconocido en la linea %d columna %d"%(linea, columna))
                if (_in(caracter_actual, numeros)){
                    token += caracter_actual
                    estado = ESTADO_NUMERO
                }
                else if( _in(caracter_actual, palabras)){
                    token += caracter_actual
                    estado = ESTADO_PALABRA
                }else if( _in(caracter_actual, simbolos)){
                    push_char(caracter_actual) //Podria ser algo valido como ();,
                    estado = ESTADO_SIMBOLO
                }else if( caracter_actual == '\n'){
                    tiene_cambio_de_linea = true;
                }
            }else if( estado == ESTADO_NUMERO){
                if (! _in(caracter_actual, caracteres))
                    throw KarelException("Caracter desconocido en la linea %d columna %d"%(linea, columna))
                if (_in(caracter_actual, numeros))
                    token += caracter_actual
                else if( _in(caracter_actual, palabras)) //Encontramos una letra en el estado numero, incorrecto
                    throw KarelException("Este token no parece valido, linea %d columna %d"%(linea, columna))
                else if( _in(caracter_actual, simbolos)){
                    estado = ESTADO_SIMBOLO
                    push_char(caracter_actual)
                    break
                }else if( _in(caracter_actual, espacios)){
                    if( caracter_actual == '\n')
                        tiene_cambio_de_linea = true
                    estado = ESTADO_ESPACIO
                    break //Terminamos este token
                }
            }else if( estado == ESTADO_PALABRA){
                if (! _in(caracter_actual, caracteres))
                    throw KarelException("Caracter desconocido en la linea %d columna %d"%(linea, columna))
                if (_in(caracter_actual, palabras+numeros))
                    token += caracter_actual
                else if( _in(caracter_actual, simbolos)){
                    estado = ESTADO_SIMBOLO
                    push_char(caracter_actual)
                    break
                }else if( _in(caracter_actual, espacios)){
                    if (caracter_actual == '\n')
                        tiene_cambio_de_linea = true
                    estado = ESTADO_ESPACIO
                    break //Terminamos este token
                }
            }else if( estado == ESTADO_SIMBOLO){
                if (! _in(caracter_actual, caracteres))
                    throw KarelException("Caracter desconocido en la linea %d columna %d"%(linea, columna))
                if (caracter_actual == '{'){
                    abrir_comentario = '{'
                    estado = ESTADO_COMENTARIO
                }else if( _in(caracter_actual, numeros)){
                    estado = ESTADO_NUMERO
                    push_char(caracter_actual)
                    if (token)
                        break
                    else
                        continue
                }else if( _in(caracter_actual, palabras)){
                    estado = ESTADO_PALABRA
                    push_char(caracter_actual)
                    if(token)
                        break
                }else if( _in(caracter_actual, simbolos)){
                    if( ultimo_caracter == "("){
                        if( caracter_actual == '*'){
                            token = ''
                            estado = ESTADO_COMENTARIO
                            abrir_comentario = '(*'
                            continue
                        }else{
                            push_char(caracter_actual)
                            break
                        }
                    }else if( caracter_actual != '('){ //el único símbolo con continuación
                        token += caracter_actual
                        //  push_char(caracter_actual)
                        break
                    }else{
                        token += caracter_actual
                        continue
                    }
                }else if( _in(caracter_actual, espacios)){
                    if (caracter_actual == '\n')
                        tiene_cambio_de_linea = true
                    estado = ESTADO_ESPACIO
                }
            }
            i++;
        }
        resultado.push(token);
        token = '';
        if(salida)
            break;
    }

    return resultado;
}
