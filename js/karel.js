/*
 * Analizador léxico para Karel escrito en javascript, especialmente
 * adaptado para el navegador
 */

//Formato de cadenas
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

if(!Array.prototype.forEach) {
    Array.prototype.forEach = function(f){
        for(i=0;i<this.length;i++){
            f(this[i])
        }
    }
}

if(!Array.prototype.toInt) {
    Array.prototype.toInt = function() {
        for(i=0;i<this.length;i++){
            this[i] = this[i]*1
        }
    }
}

if(!Array.prototype.top) {
    Array.prototype.top = function() {
        return this[this.length-1];
    }
}

if(!Array.prototype.is_empty) {
    Array.prototype.is_empty = function() {
        return this.length == 0
    }
}

if(!Array.prototype.en_tope) {
    Array.prototype.en_tope = function(id) {
        if(this.is_empty())
            return false
        ultimo = this.top()
        return ultimo['id'] == id
    }
}

ascii_letters = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'

KLexer = function(cadena, debug){
    this.ESTADO_ESPACIO = ' '
    this.ESTADO_PALABRA = 'a'
    this.ESTADO_COMENTARIO = '//'
    this.ESTADO_NUMERO = '0'
    this.ESTADO_SIMBOLO = '+'

    this.lee_caracter = function(){
    /* Lee un caracter de la fuente */
        this.ultimo_caracter = this.caracter_actual
        var c = this.cadena[this.indice];
        this.indice ++;
        return c;
    }
    //Se construye el analizador con el nombre del archivo
    this.cadena = cadena
    this.indice = 0

    this.numeros = "0123456789"
    this.palabras = "abcdfeghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-"
    this.simbolos = "(){}*/;,|&!//" //Simbolos permitidos para esta sintaxis
    this.espacios = " \n\r\t"

    this.caracteres = this.numeros+this.palabras+this.simbolos+this.espacios

    this.ultimo_caracter = ''
    this.caracter_actual = ''
    this.abrir_comentario = '' //Indica cómo fue abierto un comentario

    this.pila_tokens = [] //Pila de tokens por si me lo devuelven
    this.char_pushed = false //Indica cuando un caracter ha sido puesto en la pila

    this.linea = 1 //El número de linea
    this.columna = 0//El número de columna
    this.es_primer_token = true //Registra si se trata del primer token de la linea
    this.token = ''
    this.estado = this.ESTADO_ESPACIO

    this.sintaxis = 'pascal' //para la gestion de los comentarios
    this.lonely_chars = [';', '{', '}', '!', ')', '#']

    this.caracter_actual = this.lee_caracter()
    this.debug = debug

    this.establecer_sintaxis = function(sintaxis){
        // Establece la sintaxis para este análisis"""
        if (sintaxis == 'java'){
            this.lonely_chars.push('(')
            this.lonely_chars.push(')')
        }
        if (sintaxis == 'ruby'){
            this.lonely_chars.splice(5, 1)
        }
        this.sintaxis = sintaxis
    }

    this.get_token = function(){
        /* Obtiene el siguiente token. Si la pila tiene tokens le quita
         * uno, si no, obtiene el siguiente token del archivo*/
        if (this.pila_tokens.length > 0){
            return this.pila_tokens.pop()
        } else {
            return this.lee_token()
        }
    }

    this.push_token = function(token){
        /* Empuja un token en la pila */
        this.pila_tokens.push(token)
    }

    this.cambio_de_linea = function(){
        this.linea += 1
        this.columna = 0
        this.es_primer_token = true
    }

    this.lee_token = function(){
        // Lee un token del archivo"""
        while (true){
            this.columna += 1
            if (! this.caracter_actual){
                break
            }
            if (this.estado == this.ESTADO_COMENTARIO){
                if (this.debug){
                    console.log( "Encontré '"+this.caracter_actual+"' en estado comentario")
                }
                if (this.simbolos.indexOf(this.caracter_actual)!=-1){ //Lo que puede pasar es que sea basura o termine el comentario
                    if (this.caracter_actual == ')' && this.abrir_comentario == '(*' && this.ultimo_caracter == '*')
                        this.estado = this.ESTADO_ESPACIO
                    if (this.caracter_actual == '}' && this.abrir_comentario == '{')
                        this.estado = this.ESTADO_ESPACIO
                    if (this.caracter_actual == '/' && this.abrir_comentario == '/*' && this.ultimo_caracter == '*')
                        this.estado = this.ESTADO_ESPACIO
                }
                if (this.caracter_actual == '\n') //LINEA
                    this.cambio_de_linea()
            } else if (this.estado == this.ESTADO_ESPACIO){
                if (this.debug)
                    console.log( "Encontré "+this.caracter_actual+" en estado espacio")
                if (this.caracteres.indexOf(this.caracter_actual)==-1)
                    throw "Caracter desconocido en la linea "+this.linea+" columna "+this.columna
                if (this.numeros.indexOf(this.caracter_actual) != -1){
                    this.token += this.caracter_actual
                    this.estado = this.ESTADO_NUMERO
                } else if (this.palabras.indexOf(this.caracter_actual) != -1){
                    this.token += this.caracter_actual
                    this.estado = this.ESTADO_PALABRA
                } else if (this.simbolos.indexOf(this.caracter_actual) != -1){
                    this.estado = this.ESTADO_SIMBOLO
                    continue
                } else if (this.caracter_actual == '\n') //LINEA
                    this.cambio_de_linea()
            } else if (this.estado == this.ESTADO_NUMERO){
                if (this.debug)
                    console.log( "Encontré "+this.caracter_actual+" en estado número")
                if (this.caracteres.indexOf(this.caracter_actual) == -1)
                    throw "Caracter desconocido en la linea "+this.linea+" columna "+this.columna
                if (this.numeros.indexOf(this.caracter_actual) != -1)
                    this.token += this.caracter_actual
                else if (this.palabras.indexOf(this.caracter_actual) != -1) //Encontramos una letra en el estado numero, incorrecto
                    throw "Este token no parece valido, linea "+this.linea+" columna "+this.columna
                else if (this.simbolos.indexOf(this.caracter_actual) != -1){
                    this.estado = this.ESTADO_SIMBOLO
                    break
                } else if (this.espacios.indexOf(this.caracter_actual) != -1){
                    this.estado = this.ESTADO_ESPACIO
                    break //Terminamos este token
                }
            } else if (this.estado == this.ESTADO_PALABRA){
                if (this.debug)
                    console.log( "Encontré "+this.caracter_actual+" en estado palabra")
                if (this.caracteres.indexOf(this.caracter_actual)==-1)
                    throw "Caracter desconocido en la linea "+this.linea+" columna "+this.columna
                if ((this.palabras+this.numeros).indexOf(this.caracter_actual) != -1)
                    this.token += this.caracter_actual
                else if (this.simbolos.indexOf(this.caracter_actual) != -1){
                    this.estado = this.ESTADO_SIMBOLO
                    break
                } else if (this.espacios.indexOf(this.caracter_actual) != -1){
                    this.estado = this.ESTADO_ESPACIO
                    break //Terminamos este token
                }
            } else if (this.estado == this.ESTADO_SIMBOLO){
                if (this.debug)
                    console.log( "Encontré "+this.caracter_actual+" en estado símbolo")
                if (this.caracteres.indexOf(this.caracter_actual) == -1)
                    throw "Caracter desconocido en la linea "+this.linea+" columna "+this.columna
                if (this.caracter_actual == '{' && this.sintaxis=='pascal'){
                    this.abrir_comentario = '{'
                    this.estado = this.ESTADO_COMENTARIO
                    if (this.token)
                        break
                } else if (this.caracter_actual == '#'){
                    this.estado = this.ESTADO_ESPACIO
                    this.archivo.readline() //LINEA
                    this.cambio_de_linea()
                    if (this.token)
                        break
                } else if (this.numeros.indexOf(this.caracter_actual) != -1){
                    this.estado = this.ESTADO_NUMERO
                    if (this.token)
                        break
                } else if (this.palabras.indexOf(this.caracter_actual) != -1){
                    this.estado = this.ESTADO_PALABRA
                    if (this.token)
                        break
                } else if (this.simbolos.indexOf(this.caracter_actual) != -1){ //Encontramos un símbolo en estado símbolo
                    if (this.caracter_actual == '/' && this.ultimo_caracter == '/'){
                        this.archivo.readline() //LINEA
                        this.cambio_de_linea()
                        this.estado = this.ESTADO_ESPACIO
                        if (this.token.charAt(this.token.length-1) == '/')
                            this.token = this.token.slice(0, this.token.length-1)
                        if (this.token){
                            this.caracter_actual = this.lee_caracter()
                            break
                        }
                    } else if (this.caracter_actual == '*' && this.ultimo_caracter == '/' && this.sintaxis == 'java'){
                        this.estado = this.ESTADO_COMENTARIO
                        this.abrir_comentario = '/*'
                        if (this.token.charAt(this.token.length-1) == '/')
                            this.token = this.token.slice(0, this.token.length-1)
                        if (this.token){
                            this.caracter_actual = this.lee_caracter()
                            break
                        }
                    } else if (this.caracter_actual == '*' && this.ultimo_caracter == '(' && this.sintaxis == 'pascal'){
                        this.estado = this.ESTADO_COMENTARIO
                        this.abrir_comentario = '(*'
                        if (this.token.charAt(this.token.length-1) == '(')
                            this.token = this.token.slice(0, this.token.length-1)
                        if (this.token){
                            this.caracter_actual = this.lee_caracter()
                            break
                        }
                    } else if (this.lonely_chars.indexOf(this.caracter_actual) != -1){ //Caracteres que viven solos
                        this.estado = this.ESTADO_ESPACIO
                        if (this.token)
                            break
                        this.token += this.caracter_actual
                        this.caracter_actual = this.lee_caracter()
                        break
                    } else
                        this.token += this.caracter_actual
                } else if (this.espacios.indexOf(this.caracter_actual) != -1){
                    this.estado = this.ESTADO_ESPACIO
                    if (this.token)
                        break
                } else
                    throw "Caracter desconocido en la linea "+this.linea+" columna "+this.columna
            }
            this.caracter_actual = this.lee_caracter()
        }
        token = this.token
        this.token = ''
        var obj_token = new Object;
        obj_token.token = token
        obj_token.es_primer_token = this.es_primer_token
        obj_token.toString = function(){
            return this.token
        }
        obj_token.lower = function(){
            this.token = this.token.toLowerCase()
        }
        this.es_primer_token = false
        return obj_token
    }
}

KGrammar = function(lexer, strict, futuro, strong_logic){
    /* Inicializa la gramatica:
    flujo           indica el torrente de entrada
    archivo         es el nombre del archivo fuente, si existe
    strict          Marca una sintaxis más 'estricta' que impide no usar la sentencia apágate
    futuro          indica si se pueden usar caracteristicas del futuro
                    de Karel como las condiciones 'falso' y 'verdadero'
    strong_logic    Elimina las negaciones del lenguaje de karel, propiciando el uso de la
                    palabra 'no' para negar enunciados
    */
    this.strict = strict
    this.tiene_apagate = false
    this.instrucciones = ['avanza', 'gira-izquierda', 'coge-zumbador', 'deja-zumbador', 'apagate', 'sal-de-instruccion', 'sal-de-bucle', 'continua-bucle']
    this.instrucciones_java = ['move', 'turnleft', 'pickbeeper', 'putbeeper', 'turnoff', 'return', 'break', 'continue']
    //La instruccion sirve para combinarse con el bucle mientras y la condicion verdadero
    this.condiciones = [
        'frente-libre',
        'derecha-libre',
        'izquierda-libre',
        'junto-a-zumbador',
        'algun-zumbador-en-la-mochila',
        "orientado-al-norte",
        "orientado-al-este",
        "orientado-al-sur",
        "orientado-al-oeste",
        "no-orientado-al-oeste",
        "no-orientado-al-norte",
        "no-orientado-al-sur",
        "no-orientado-al-este",
        'no-junto-a-zumbador',
        'derecha-bloqueada',
        'frente-bloqueado',
        'izquierda-bloqueada',
        'ningun-zumbador-en-la-mochila',
        "si-es-cero",
        "verdadero", //Reservadas para futuros usos
        "falso" //reservadas para futuros usos
    ]
    this.condiciones_java = [
        'frontIsClear',
        'rightIsClear',
        'leftIsClear',
        'nextToABeeper',
        'anyBeepersInBeeperBag',
        "facingNorth",
        "facingEast",
        "facingSouth",
        "facingWest",
        "notFacingNorth",
        "notFacingEast",
        "notFacingSouth",
        "notFacingWest",
        'notNextToABeeper',
        'rightIsBlocked',
        'frontIsBlocked',
        'leftIsBlocked',
        'noBeepersInBeeperBag',
        "iszero",
        "true", //Reservadas para futuros usos
        "false" //reservadas para futuros usos
    ]
    if (strong_logic){ //Se eliminan las negaciones del lenguaje de Karel
        this.condiciones = this.condiciones.slice(0, 9).concat(this.condiciones.slice(18))
        this.condiciones_java = this.condiciones_java.slice(0,9).concat(this.condiciones_java(18))
    }
    if (!futuro){
        this.condiciones = this.condiciones.slice(0, this.condiciones.length-2)
        this.condiciones_java = this.condiciones_java.slice(0, this.condiciones_java.length-2)
        this.instrucciones = this.instrucciones.slice(0, this.instrucciones.length-2)
        this.instrucciones_java = this.instrucciones_java.slice(0, this.instrucciones_java.length-2)
    }
    this.expresiones_enteras = ['sucede', 'precede']
    this.expresiones_enteras_java = ['succ', 'pred']

    this.estructuras = ['si', 'mientras', 'repite', 'repetir']
    this.estructuras_java = ['if', 'while', 'iterate']
    this.estructuras_ruby = ['si', 'mientras']

    this.palabras_reservadas_java = [
        "class",
        "void",
        "define"
    ].concat(this.instrucciones_java).concat(this.condiciones_java).concat(this.expresiones_enteras_java).concat(this.estructuras_java)

    this.palabras_reservadas_ruby = [
        "this.",
        "veces",
        "fin",
        "o",
        "y",
        "no"
    ].concat(this.instrucciones).concat(this.condiciones).concat(this.expresiones_enteras).concat(this.estructuras_ruby)

    this.palabras_reservadas = [
        "iniciar-programa",
        "inicia-ejecucion",
        "termina-ejecucion",
        "finalizar-programa",
        "no",
        "y",
        "o",
        "u",
        "define-nueva-instruccion",
        "define-prototipo-instruccion",
        "inicio",
        "fin",
        "hacer",
        "veces",
        "entonces",
        "sino"
    ].concat(this.instrucciones).concat(this.condiciones).concat(this.expresiones_enteras).concat(this.estructuras)

    this.lexer = lexer
    this.token_actual = this.lexer.get_token()
    this.prototipo_funciones = {}
    this.funciones = {}
    this.llamadas_funciones = {}
    this.arbol = {
        "main": [], //Lista de instrucciones principal, declarada en 'inicia-ejecucion'
        "funciones": {} //Diccionario con los nombres de las funciones como llave
    }
    // Un diccionario que tiene por llaves los nombres de las funciones
    // y que tiene por valores listas con las variables de dichas
    // funciones
    this.lista_programa = []
    this.ejecutable = {
        'lista': [],
        'indice_funciones': [],
        'main': 0
    }
    // Una lista que puede contener el árbol expandido con las instrucciones
    // del programa de forma adecuada
    this.futuro = futuro
    this.sintaxis = 'pascal' //puede cambiar a java segun el primer token del programa
    this.nombre_clase = '' //Para la sintaxis de java

    this.obtener_linea_error = function(){
        //Obtiene la línea en la que acaba de ocurrir el error
        if (this.token_actual.es_primer_token)
            return this.lexer.linea - 1
        else
            return this.lexer.linea
    }

    this.avanza_token = function(){
        /* Avanza un token en el archivo */
        siguiente_token = this.lexer.get_token()

        if (siguiente_token.token != ''){
            if (this.sintaxis == 'pascal'){
                siguiente_token.lower()
            }
            this.token_actual = siguiente_token
            return true
        } else
            return false
    }

    this.verificar_sintaxis = function(){
        /*Verifica que este correcta la gramatica de un programa
        en karel */
        if (this.token_actual.token == 'iniciar-programa'){
            if (this.avanza_token()){
                this.bloque()
                if (this.token_actual.token != 'finalizar-programa')
                    throw "Se esperaba 'finalizar-programa' al final del codigo"
            } else
                throw "Codigo mal formado"
        } else if (this.token_actual.token == 'class'){ //Está escrito en java
            this.sintaxis = 'java'
            this.lexer.establecer_sintaxis('java')
            if (this.avanza_token()){
                if (this.es_identificador_valido(this.token_actual.token)){
                    this.nombre_clase = this.token_actual.token
                    this.avanza_token()
                    this.class_body()

                    //toca revisar las llamadas a funciones hechas durante el programa
                    for(funcion in this.llamadas_funciones){
                        if (this.funciones[funcion] != undefined){
                            if (this.funciones[funcion].length != this.llamadas_funciones[funcion])
                                throw "La funcion '"+funcion+"' no se llama con la misma cantidad de parámetros que como se definió"
                        } else
                            throw "La función '"+funcion+"' es llamada pero no fue declarada"
                    }
                } else
                    throw this.token_actual+' no es un identificador valido'
            } else
                throw "Codigo mal formado"
        } else {
            this.sintaxis = 'ruby'
            this.lexer.establecer_sintaxis('ruby')

            this.arbol['main'] = this.ruby_codeblock([], false, false)
        }
        if (this.strict && (! this.tiene_apagate))
            throw "Tu código no tiene 'apagate', esto no es permitido en el modo estricto"
    }

    this.es_identificador_valido = function(token){
        /* Identifica cuando una cadena es un identificador valido,
        osea que puede ser usado en el nombre de una variable, las
        reglas son:
        * Debe comenzar en una letra
        * Sólo puede tener letras, números, '-' y '_' */
        es_valido = true
        for (var i=0;i<token.length;i++){
            if (i == 0){
                if(ascii_letters.indexOf(token[i]) == -1){
                    //Un identificador válido comienza con una letra
                    es_valido = false
                }
            } else {
                if((this.lexer.palabras+this.lexer.numeros).indexOf(token[i]) == -1){
                    es_valido = false
                    break
                }
            }
            i += 1
        }
        return es_valido
    }

    this.bloque = function(){
        /*
        Define un bloque en la sitaxis de karel
        {BLOQUE ::=
                [DeclaracionDeProcedimiento ";" | DeclaracionDeEnlace ";"] ...
                "INICIA-EJECUCION"
                   ExpresionGeneral [";" ExpresionGeneral]...
                "TERMINA-EJECUCION"
        }
        Un bloque se compone de todo el codigo admitido entre iniciar-programa
        y finalizar-programa
        */

        while (this.token_actual.token == 'define-nueva-instruccion' || this.token_actual.token == 'define-prototipo-instruccion' || this.token_actual.token == 'externo'){
            if (this.token_actual.token == 'define-nueva-instruccion')
                this.declaracion_de_procedimiento()
            else if (this.token_actual.token == 'define-prototipo-instruccion')
                this.declaracion_de_prototipo()
            else {
                //Se trata de una declaracion de enlace
                this.declaracion_de_enlace()
            }
        }
        //Toca verificar que todos los prototipos se hayan definido
        for(funcion in this.prototipo_funciones){
            if(! funcion in this.funciones){
                throw "La instrucción '"+funcion+"' tiene prototipo pero no fue definida"
            }
        }
        //Sigue el bloque con la lógica del programa
        if (this.token_actual.token == 'inicia-ejecucion'){
            this.avanza_token()
            this.arbol['main'] = this.expresion_general([], false, false)
            if (this.token_actual.token != 'termina-ejecucion')
                throw "Se esperaba 'termina-ejecucion' al final del bloque lógico del programa, encontré '"+this.token_actual+"'"
            else
                this.avanza_token()
        }
    }

    this.expresion_general = function(lista_variables, c_funcion, c_bucle){
        /*
        Define una expresion general
        { Expresion | ExpresionVacia }
        Generalmente se trata de una expresión dentro de las etiquetas
        'inicio' y 'fin' o entre 'inicia-ejecucion' y 'termina-ejecucion'
        */
        retornar_valor = [] //Una lista de funciones

        while (this.token_actual.token != 'fin' && this.token_actual.token != 'termina-ejecucion'){
            retornar_valor = retornar_valor.concat(this.expresion(lista_variables, c_funcion, c_bucle))
            if (this.token_actual.token != ';' && this.token_actual.token != 'fin' && this.token_actual.token != 'termina-ejecucion')
                throw "Se esperaba ';'"
            else if (this.token_actual == ';')
                this.avanza_token()
            else if (this.token_actual == 'fin')
                throw "Se esperaba ';'"
            else if (this.token_actual == 'termina-ejecucion')
                throw "Se esperaba ';'"
        }

        return retornar_valor
    }

    this.expresion = function(lista_variables, c_funcion, c_bucle){
        /*
        Define una expresion
        {
        Expresion :: = {
                          "apagate"
                          "gira-izquierda"
                          "avanza"
                          "coge-zumbador"
                          "deja-zumbador"
                          "sal-de-instruccion"
                          ExpresionLlamada
                          ExpresionSi
                          ExpresionRepite
                          ExpresionMientras
                          "inicio"
                              ExpresionGeneral [";" ExpresionGeneral] ...
                          "fin"
                       }{
        }
        Recibe para comprobar una lista con las variables válidas en
        este contexto, tambien comprueba mediante c_funcion si esta en
        un contexto donde es valido el sal-de-instruccion.
        */
        retornar_valor = []

        if(this.instrucciones.indexOf(this.token_actual.token) != -1){
            if (this.token_actual.token == 'sal-de-instruccion'){
                if (c_funcion){
                    retornar_valor = [this.token_actual.token]
                    this.avanza_token()
                } else
                    throw "No es posible usar 'sal-de-instruccion' fuera de una instruccion :)"
            } else if (this.token_actual.token == 'sal-de-bucle' || this.token_actual.token == 'continua-bucle'){
                if (c_bucle){
                    retornar_valor = [this.token_actual.token]
                    this.avanza_token()
                } else
                    throw "No es posible usar '"+this.token_actual.token+"' fuera de un bucle :)"
            } else{
                if (this.token_actual.token == 'apagate')
                    this.tiene_apagate = true
                retornar_valor = [this.token_actual.token]
                this.avanza_token()
            }
        } else if (this.token_actual.token == 'si')
            retornar_valor = [this.expresion_si(lista_variables, c_funcion, c_bucle)]
        else if (this.token_actual.token == 'mientras')
            retornar_valor = [this.expresion_mientras(lista_variables, c_funcion)]
        else if (this.token_actual.token == 'repite' || this.token_actual.token == 'repetir')
            retornar_valor = [this.expresion_repite(lista_variables, c_funcion)]
        else if (this.token_actual.token == 'inicio'){
            this.avanza_token()
            retornar_valor = this.expresion_general(lista_variables, c_funcion, c_bucle)
            if (this.token_actual.token == 'fin')
                this.avanza_token()
            else
                throw "Se esperaba 'fin' para concluir el bloque, encontré '"+this.token_actual+"'"
        } else if (this.palabras_reservadas.indexOf(this.token_actual.token) == -1 && this.es_identificador_valido(this.token_actual.token)){
            //Se trata de una instrucción creada por el usuario
            if (this.token_actual.token in this.prototipo_funciones || this.token_actual.token in this.funciones){
                nombre_funcion = this.token_actual.token
                retornar_valor = [{
                    'estructura': 'instruccion',
                    'nombre': nombre_funcion,
                    'argumento': []
                }]
                this.avanza_token()
                requiere_parametros = true
                num_parametros = 0
                if (this.token_actual.token == '('){
                    this.avanza_token()
                    while (true){
                        retornar_valor[0]['argumento'].push(this.expresion_entera(lista_variables))
                        num_parametros += 1
                        if (this.token_actual.token == ')'){
                            //this.lexer.push_token(')') #Devolvemos el token a la pila
                            break
                        } else if (this.token_actual.token == ',')
                            this.avanza_token()
                        else
                            throw "Se esperaba ',', encontré '"+this.token_actual+"'"
                    }
                    if (! this.futuro && num_parametros>1)
                        throw "No están habilitadas las funciones con varios parámetros"
                    this.avanza_token()
                }
                if (nombre_funcion in this.prototipo_funciones){
                    if (num_parametros != this.prototipo_funciones[nombre_funcion].length)
                        throw "Estas intentando llamar la funcion '"+nombre_funcion+"' con "+num_parametros+" parámetros, pero así no fue definida"
                } else{
                    if (num_parametros != this.funciones[nombre_funcion].length)
                        throw "Estas intentando llamar la funcion '"+nombre_funcion+"' con "+num_parametros+" parámetros, pero así no fue definida"
                }
            } else
                throw "La instrucción '"+this.token_actual+"' no ha sido previamente definida, pero es utilizada"
        } else
            throw "Se esperaba un procedimiento, '"+this.token_actual+"' no es válido"

        return retornar_valor
    }

    this.declaracion_de_procedimiento = function(){
        /*
        Define una declaracion de procedimiento
        {
            DeclaracionDeProcedimiento ::= "DEFINE-NUEVA-INSTRUCCION" Identificador ["(" Identificador ")"] "COMO"
                                         Expresion
        }
        Aqui se definen las nuevas funciones que extienden el lenguaje
        de Karel, como por ejemplo gira-derecha.
        */

        this.avanza_token()

        requiere_parametros = false //Indica si la funcion a definir tiene parametros
        nombre_funcion = ''

        if (this.palabras_reservadas.indexOf(this.token_actual.token) != -1 || ! this.es_identificador_valido(this.token_actual.token))
            throw "Se esperaba un nombre de procedimiento válido, '"+this.token_actual+"' no lo es"

        if (this.token_actual.token in this.funciones)
            throw "Ya se ha definido una funcion con el nombre '"+this.token_actual+"'"
        else{
            this.funciones[this.token_actual.token] = []
            nombre_funcion = this.token_actual.token
        }

        this.arbol['funciones'][nombre_funcion] = {
            'params': [],
            'cola': []
        }

        this.avanza_token()

        if (this.token_actual.token == 'como')
            this.avanza_token()
        else if (this.token_actual.token == '('){
            this.avanza_token()
            requiere_parametros = true
            while (true){
                if (this.palabras_reservadas.indexOf(this.token_actual.token) != -1 || ! this.es_identificador_valido(this.token_actual.token))
                    throw "Se esperaba un nombre de variable, '"+this.token_actual+"' no es válido"
                else {
                    if (this.funciones[nombre_funcion].indexOf(this.token_actual.token) != -1)
                        throw "La funcion '"+nombre_funcion+"' ya tiene un parámetro con el nombre '"+this.token_actual+"'"
                    else{
                        this.funciones[nombre_funcion].push(this.token_actual.token)
                        this.avanza_token()
                    }

                    if (this.token_actual.token == ')'){
                        this.lexer.push_token(this.token_actual) //Devolvemos el token a la pila
                        break
                    } else if (this.token_actual.token == ',')
                        this.avanza_token()
                    else
                        throw "Se esperaba ',', encontré '"+this.token_actual+"'"
                }
            }
            this.arbol['funciones'][nombre_funcion]['params'] = this.funciones[nombre_funcion]
        } else
            throw "Se esperaba la palabra clave 'como' o un parametro"

        if (requiere_parametros){
            this.avanza_token()
            if (this.token_actual.token != ')')
                throw "Se esperaba ')'"
            this.avanza_token()
            if (this.token_actual.token != 'como')
                throw "se esperaba la palabra clave 'como'"
            this.avanza_token()
        }

        if (nombre_funcion in this.prototipo_funciones){
            //Hay que verificar que se defina como se planeó
            if (this.prototipo_funciones[nombre_funcion].length != this.funciones[nombre_funcion].length)
                throw "La función '"+nombre_funcion+"' no está definida como se planeó en el prototipo, verifica el número de variables"
        }

        this.arbol['funciones'][nombre_funcion]['cola'] = this.expresion(this.funciones[nombre_funcion], true, false)

        if (this.token_actual.token != ';')
            throw "Se esperaba ';'"
        else
            this.avanza_token()
    }

    this.expresion_si = function(lista_variables, c_funcion, c_bucle){
        /*
        Define la expresion del condicional SI
        {
        ExpresionSi ::= "SI" Termino "ENTONCES"
                             Expresion
                        ["SINO"
                               Expresion
                        ]
        }
        */
        retornar_valor_si = {
            'estructura': 'si',
            'argumento': undefined,
            'cola': []
        }

        this.avanza_token()

        retornar_valor_si['argumento'] = this.termino(lista_variables)

        if (this.token_actual.token != 'entonces')
            throw "Se esperaba 'entonces'"

        this.avanza_token()

        retornar_valor_si['cola'] = this.expresion(lista_variables, c_funcion, c_bucle)

        if (this.token_actual.token == 'sino') {
            retornar_valor_si['sino-cola'] = []
            this.avanza_token()
            retornar_valor_si['sino-cola'] = this.expresion(lista_variables, c_funcion, c_bucle)
        }

        return retornar_valor_si
    }

    this.termino = function(lista_variables){
        /*
        Define un termino
        {
            Termino ::= ClausulaY [ "o" ClausulaY] ...
        }
        Se usan dentro de los condicionales 'si' y el bucle 'mientras'
        */
        retornar_valor = {'o': [this.clausula_y(lista_variables)]} //Lista con las expresiones 'o'

        while (this.token_actual.token == 'o' || this.token_actual.token == 'u'){
            this.avanza_token()
            retornar_valor['o'].push(this.clausula_y(lista_variables))
        }

        return retornar_valor
    }

    this.clausula_y = function(lista_variables){
        /*
        Define una clausula conjuntiva
        {
            ClausulaY ::= ClausulaNo ["Y" ClausulaNo]...
        }
        */
        retornar_valor = {'y': [this.clausula_no(lista_variables)]}

        while (this.token_actual.token == 'y'){
            this.avanza_token()
            retornar_valor['y'].push(this.clausula_no(lista_variables))
        }

        return retornar_valor
    }

    this.clausula_no = function(lista_variables){
        /*
        Define una clausula de negacion
        {
            ClausulaNo ::= ["NO"] ClausulaAtomica
        }
        */
        retornar_valor = undefined

        if (this.token_actual.token == 'no'){
            this.avanza_token()
            retornar_valor = {'no': this.clausula_atomica(lista_variables)}
        } else
            retornar_valor = this.clausula_atomica(lista_variables)

        return retornar_valor
    }

    this.clausula_atomica = function(lista_variables){
        /*
        Define una clausila atomica
        {
        ClausulaAtomica ::=  {
                              "SI-ES-CERO" "(" ExpresionEntera ")" |
                              FuncionBooleana |
                              "(" Termino ")"
                             }{
        }
        */
        retornar_valor = undefined

        if (this.token_actual.token == 'si-es-cero'){
            this.avanza_token()
            if (this.token_actual.token == '('){
                this.avanza_token()
                retornar_valor = {'si-es-cero': this.expresion_entera(lista_variables)}
                if (this.token_actual.token == ')')
                    this.avanza_token()
                else
                    throw "Se esperaba ')'"
            } else
                throw "Se esperaba '(' para indicar argumento de 'si-es-cero'"
        } else if (this.token_actual.token == '('){
            this.avanza_token()
            retornar_valor = this.termino(lista_variables)
            if (this.token_actual.token == ')')
                this.avanza_token()
            else
                throw "Se esperaba ')'"
        } else
            retornar_valor = this.funcion_booleana()

        return retornar_valor
    }

    this.funcion_booleana = function(){
        /*
        Define una funcion booleana del mundo de karel
        {
        FuncionBooleana ::= {
                               "FRENTE-LIBRE"
                               "FRENTE-BLOQUEADO"
                               "DERECHA-LIBRE"
                               "DERECHA-BLOQUEADA"
                               "IZQUIERAD-LIBRE"
                               "IZQUIERDA-BLOQUEADA"
                               "JUNTO-A-ZUMBADOR"
                               "NO-JUNTO-A-ZUMBADOR"
                               "ALGUN-ZUMBADOR-EN-LA-MOCHILA"
                               "NINGUN-ZUMBADOR-EN-LA-MOCHILA"
                               "ORIENTADO-AL-NORTE"
                               "NO-ORIENTADO-AL-NORTE"
                               "ORIENTADO-AL-ESTE"
                               "NO-ORIENTADO-AL-ESTE"
                               "ORIENTADO-AL-SUR"
                               "NO-ORIENTADO-AL-SUR"
                               "ORIENTADO-AL-OESTE"
                               "NO-ORIENTADO-AL-OESTE"
                               "VERDADERO"
                               "FALSO"
                            }{
        }
        Son las posibles funciones booleanas para Karel
        */
        retornar_valor = ""

        if (this.condiciones.indexOf(this.token_actual.token) != -1){
            retornar_valor = this.token_actual.token
            this.avanza_token()
        } else
            throw "Se esperaba una condición como 'frente-libre', '"+this.token_actual+"' no es una condición"

        return retornar_valor
    }

    this.expresion_mientras = function(lista_variables, c_funcion){
        /*
        Define la expresion del bucle MIENTRAS
        {
        ExpresionMientras ::= "Mientras" Termino "hacer"
                                  Expresion
        }
        */
        retornar_valor_mientras = {
            'estructura': 'mientras',
            'argumento': undefined,
            'cola': []
        }
        this.avanza_token()

        retornar_valor_mientras['argumento'] = this.termino(lista_variables)

        if (this.token_actual.token != 'hacer')
            throw "Se esperaba 'hacer'"
        this.avanza_token()
        retornar_valor_mientras['cola'] = this.expresion(lista_variables, c_funcion, true)

        return retornar_valor_mientras
    }

    this.expresion_repite = function(lista_variables, c_funcion){
        /*
        Define la expresion del bucle REPITE
        {
        ExpresionRepite::= "repetir" ExpresionEntera "veces"
                              Expresion
        }
        */
        retornar_valor_repite = {
            'estructura': 'repite',
            'argumento': undefined,
            'cola': []
        }

        this.avanza_token()
        retornar_valor_repite['argumento'] = this.expresion_entera(lista_variables)

        if (this.token_actual.token != 'veces')
            throw "Se esperaba la palabra 'veces', '"+this.token_actual+"' no es válido"

        this.avanza_token()
        retornar_valor_repite['cola'] = this.expresion(lista_variables, c_funcion, true)

        return retornar_valor_repite
    }

    this.expresion_entera = function(lista_variables){
        /*
        Define una expresion numerica entera
        {
            ExpresionEntera ::= { Decimal | Identificador | "PRECEDE" "(" ExpresionEntera ")" | "SUCEDE" "(" ExpresionEntera ")" }{
        }
        */
        retornar_valor = undefined
        //En este punto hay que verificar que se trate de un numero entero
        es_numero = false
        if (this.es_numero(this.token_actual.token)){
            //Intentamos convertir el numero
            retornar_valor = this.token_actual.token*1
            es_numero = true
        } else {
            //No era un entero
            if (this.expresiones_enteras.indexOf(this.token_actual.token) != -1){
                expresion = this.token_actual.token
                retornar_valor = {
                    expresion: undefined
                }
                this.avanza_token()
                if (this.token_actual.token == '('){
                    this.avanza_token()
                    retornar_valor[expresion] = this.expresion_entera(lista_variables)
                    if (this.token_actual.token == ')')
                        this.avanza_token()
                    else
                        throw "Se esperaba ')'"
                } else
                    throw "Se esperaba '(' para indicar argumento de precede o sucede"
            } else if (this.palabras_reservadas.indexOf(this.token_actual.token) == -1 && this.es_identificador_valido(this.token_actual.token)){
                //Se trata de una variable definida por el usuario
                if (lista_variables.indexOf(this.token_actual.token) == -1)
                    throw "La variable '"+this.token_actual+"' no está definida en este contexto"
                retornar_valor = this.token_actual
                this.avanza_token()
            } else
                throw "Se esperaba un entero, variable, sucede o predece, '"+this.token_actual+"' no es válido"
        }
        if (es_numero){
            //Si se pudo convertir, avanzamos
            this.avanza_token()
        }

        return retornar_valor
    }

    this.es_numero = function(token){
        /*Determina si un token es un numero*/
        for (i=0;i<token.length;i++){
            if (this.lexer.numeros.indexOf(token[i]) == -1)
                return false //Encontramos algo que no es numero
        }
        return true
    }

    this.expandir_arbol = function(){
        /*Expande el árbol de instrucciones para ser usado por krunner
        durante la ejecución*/
        for (funcion in this.arbol['funciones']){ //Itera sobre llaves
            var nueva_funcion = {}
            nueva_funcion[funcion] = {
                'params': this.arbol['funciones'][funcion]['params']
            }
            this.lista_programa.push(nueva_funcion)
            var posicion_inicio = this.lista_programa.length-1

            this.ejecutable['indice_funciones'][funcion] = posicion_inicio
            this.expandir_arbol_recursivo(this.arbol['funciones'][funcion]['cola'])
            this.lista_programa.push({
                'fin': {
                    'estructura': 'instruccion',
                    'nombre': funcion,
                    'inicio': posicion_inicio
                }
            })
        }
        this.ejecutable['main'] = this.lista_programa.length
        this.expandir_arbol_recursivo(this.arbol['main'])
        this.lista_programa.push('fin') //Marca de fin del programa
        this.ejecutable['lista'] = this.lista_programa
        return this.ejecutable
    }

    this.expandir_arbol_recursivo = function(cola){
        /*Toma un arbol y lo expande*/
        for(i=0;i<cola.length;i++){
            var elem = cola[i]
            if (this.instrucciones.indexOf(elem) != -1){
                this.lista_programa.push(elem)
            } else { //Se trata de un diccionario
                if (['repite', 'mientras'].indexOf(elem['estructura']) != -1){
                    var posicion_inicio = this.lista_programa.length
                    var estructura = elem['estructura']
                    var nueva_estructura = {}
                    nueva_estructura[estructura] = {
                        'argumento': elem['argumento'],
                        'id': posicion_inicio
                    }

                    this.lista_programa.push(nueva_estructura)
                    this.expandir_arbol_recursivo(elem['cola'])
                    var posicion_fin = this.lista_programa.length
                    this.lista_programa.push({
                        'fin': {
                            'estructura': elem['estructura'],
                            'inicio': posicion_inicio
                        }
                    })
                    this.lista_programa[posicion_inicio][estructura]['fin'] = posicion_fin
                } else if (elem['estructura'] == 'si'){
                    var posicion_inicio = this.lista_programa.length
                    var nueva_estructura = {
                        'si': {
                            'argumento': elem['argumento'],
                            'id' : posicion_inicio
                        }
                    }

                    this.lista_programa.push(nueva_estructura)
                    this.expandir_arbol_recursivo(elem['cola'])
                    var posicion_fin = this.lista_programa.length
                    this.lista_programa.push({
                        'fin': {
                            'estructura': elem['estructura'],
                            'inicio': posicion_inicio,
                            'fin':posicion_fin+1
                        }
                    })
                    this.lista_programa[posicion_inicio]['si']['fin'] = posicion_fin
                    if ('sino-cola' in elem){
                        var nueva_estructura = {
                            'sino': {}
                        }
                        this.lista_programa.push(nueva_estructura)
                        this.expandir_arbol_recursivo(elem['sino-cola'])
                        var fin_sino = this.lista_programa.length
                        this.lista_programa.push({
                            'fin': {
                                'estructura': 'sino'
                            }
                        })
                        this.lista_programa[posicion_fin]['fin']['fin'] = fin_sino
                    }
                } else { //Se trata de la llamada a una función
                    var estructura = elem['estructura']
                    var nueva_estructura = {}
                    nueva_estructura[estructura] = {
                        'argumento': elem['argumento'],
                        'nombre': elem['nombre']
                    }
                    this.lista_programa.push(nueva_estructura)
                }
            }
        }
    }
}

function contrario(cardinal) {
    /* Suena ridículo, pero obtiene el punto cardinal contrario al
    dado. */
    var puntos = {
        'norte': 'sur',
        'sur': 'norte',
        'este': 'oeste',
        'oeste': 'este'
    }
    return puntos[cardinal]
}

function obten_casilla_avance(casilla, direccion) {
    /* Obtiene una casilla contigua dada una casilla de inicio y
    una direccion de avance*/
    if (direccion == 'norte')
        return [casilla[0]+1, casilla[1]]
    else if (direccion == 'sur')
        return [casilla[0]-1, casilla[1]]
    else if (direccion == 'este')
        return [casilla[0], casilla[1]+1]
    else if (direccion == 'oeste')
        return [casilla[0], casilla[1]-1]
}

function rotado(cardinal) {
    /* Obtiene la orientación resultado de un gira-izquierda en
    Karel */
    var puntos = {
        'norte': 'oeste',
        'oeste': 'sur',
        'sur': 'este',
        'este': 'norte'
    }
    return puntos[cardinal]
}

KWorld = function(filas, columnas, karel_pos, orientacion, mochila, casillas){
    if(typeof filas == 'undefined')
        var filas = 100
    if(typeof columnas == 'undefined')
        var columnas = 100
    if(typeof karel_pos == 'undefined')
        var karel_pos = [1, 1]
    if(typeof orientacion == 'undefined')
        var orientacion = 'norte'
    if(typeof mochila == 'undefined')
        var mochila = 0
    if(typeof casillas == 'undefined')
        var casillas = {}
    this.mundo = {
        'karel': {
            'posicion': karel_pos,
            'orientacion': orientacion,
            'mochila': mochila //Zumbadores en la mochila
        },
        'dimensiones': {
            'filas': filas,
            'columnas': columnas
        },
        'casillas': casillas
    }

    this.posicion_karel = function(){
        return this.mundo['karel']['posicion']
    }

    this.establece_karel = function(posicion, orientacion){
        /*pone a karel en algun lugar especifico*/
        if(typeof karel_pos == 'undefined')
            var karel_pos = [1, 1]
        if(typeof orientacion == 'undefined')
            var orientacion = 'norte'
        this.mundo['karel']['posicion'] = posicion
        this.mundo['karel']['orientacion'] = orientacion
    }

    this.establece_mochila = function(cantidad) {
        /*Establece los zumbadores en la mochila de karel a cierta cantidad*/
        if (cantidad == 'inf' || cantidad == '-1' || cantidad == -1)
            this.mundo['karel']['mochila'] = -1
        else if (typeof cantidad == 'number') {
            if (cantidad >= 0)
                this.mundo['karel']['mochila'] = cantidad
            else
                throw 'Esta no es una cantidad apropiada de zumbadores'
        } else
            throw 'Deberías consultar a un psiquiatra'
    }

    this.obten_casilla = function(coordenadas){
        /* Obtiene una casilla del mundo y la devuelve así a lo sobres */
        var casilla = {
            'zumbadores': 0,
            'paredes': []
        }
        if (coordenadas[0] == 1) //Primera fila, pared izquierda
            casilla['paredes'].push('sur')
        if (coordenadas[0] == 100)
            casilla['paredes'].push('norte')
        if (coordenadas[1] == 1) //primera columna
            casilla['paredes'].push('oeste')
        if (coordenadas[1] == 100)
            casilla['paredes'].push('este')

        var coordenadas = 'c'+coordenadas[0]+'_'+coordenadas[1]
        if (coordenadas in this.mundo['casillas']){
            casilla['zumbadores'] = this.mundo['casillas'][coordenadas]['zumbadores']
            casilla['paredes'] = casilla['paredes'].concat(this.mundo['casillas'][coordenadas]['paredes'])
        }

        return casilla
    }

    this.obten_mochila = function(){
        /*Obtiene la cantidad de zumbadores en la mochila de karel*/
        return this.mundo['karel']['mochila']
    }

    this.obten_zumbadores = function(casilla){
        /*Devuelve los zumbadores para esta casilla*/
        var casilla = 'c'+casilla[0]+'_'+casilla[1]
        if (casilla in this.mundo['casillas'])
            return this.mundo['casillas'][casilla]['zumbadores']
        else
            return 0
    }

    this.conmuta_pared = function(coordenadas, orientacion){
        /* Agrega una pared al mundo, si es que está permitido, el
        atributo 'coordenadas' es una tupla con la fila y columna de la
        casilla afectada, orientacion es una cadena que indica si se pone
        arriba, abajo, a la izquierda o a la derecha. */
        if (0<coordenadas[0] && coordenadas[0]<this.mundo['dimensiones']['filas']+1 && 0<coordenadas[1] && coordenadas[1]<this.mundo['dimensiones']['columnas']+1){
            if (coordenadas[0] == 1 && orientacion == 'sur')
                return
            if (coordenadas[0] == 100 && orientacion == 'norte')
                return
            if (coordenadas[1] == 1 && orientacion == 'oeste')
                return
            if (coordenadas[1] == 100 && orientacion == 'este')
                return
            var agregar = true //Indica si agregamos o quitamos la pared
            var scoordenadas = 'c'+coordenadas[0]+'_'+coordenadas[1]
            if (scoordenadas in this.mundo['casillas']){
                //Puede existir una pared
                if (this.mundo['casillas'][scoordenadas]['paredes'].indexOf(orientacion) != -1) {
                    //Ya existe la pared, la quitamos
                    this.mundo['casillas'][scoordenadas]['paredes'].filter(function(a){return a!=orientacion})
                    agregar = false
                } else {
                    //no existe la pared, la agregamos
                    this.mundo['casillas'][scoordenadas]['paredes'].push(orientacion)
                }
            } else {
                //No existe el indice, tampoco la pared, asi que se agrega
                this.mundo['casillas'][scoordenadas] = {
                    'paredes': [orientacion],
                    'zumbadores': 0
                }
            }
            //Debemos conmutar la pared en la casilla opuesta
            var casilla_opuesta = obten_casilla_avance(coordenadas, orientacion)
            var posicion_opuesta = contrario(orientacion)
            var scasilla_opuesta = 'c'+casilla_opuesta[0]+'_'+casilla_opuesta[1]
            if (0<casilla_opuesta[0] && casilla_opuesta[0]<this.mundo['dimensiones']['filas']+1 && 0<casilla_opuesta[1] && casilla_opuesta[1]<this.mundo['dimensiones']['columnas']+1){
                //no es una casilla en los bordes
                if (agregar){
                    //Agregamos una pared
                    if (scasilla_opuesta in this.mundo['casillas']) {
                        //Del otro lado si existe registro
                        this.mundo['casillas'][scasilla_opuesta]['paredes'].push(posicion_opuesta)
                    } else {
                        //Tampoco hay registro del otro lado
                        this.mundo['casillas'][scasilla_opuesta] = {
                            'paredes': [posicion_opuesta],
                            'zumbadores': 0
                        }
                    }
                } else {
                    //quitamos una pared, asumimos que existe el registro
                    //del lado opuesto
                    this.mundo['casillas'][scasilla_opuesta]['paredes'].filter(function(a){return a!=posicion_opuesta})
                }
            }
            //Operaciones de limpieza para ahorrar memoria
            if (! (this.mundo['casillas'][scoordenadas]['paredes'] || this.mundo['casillas'][scoordenadas]['zumbadores']))
                delete this.mundo['casillas'][scoordenadas]
            if (! (this.mundo['casillas'][scasilla_opuesta]['paredes'] || this.mundo['casillas'][scasilla_opuesta]['zumbadores']))
                delete this.mundo['casillas'][scasilla_opuesta]
        }
    }

    this.pon_zumbadores = function(posicion, cantidad){
        /* Agrega zumbadores al mundo en la posicion dada */
        if (cantidad == 'inf')
            cantidad = -1
        if (0<posicion[0] && posicion[0]<this.mundo['dimensiones']['filas']+1 && 0<posicion[1] && posicion[1]<this.mundo['dimensiones']['columnas']+1){
            var sposicion = 'c'+posicion[0]+'_'+posicion[1]
            if (sposicion in this.mundo['casillas'])
                this.mundo['casillas'][sposicion]['zumbadores'] = cantidad
            else{
                this.mundo['casillas'][sposicion] = {
                    'zumbadores': cantidad,
                    'paredes': []
                }
            }
            //Limpiamos la memoria si es necesario
            if (! (this.mundo['casillas'][sposicion]['paredes'] || this.mundo['casillas'][sposicion]['zumbadores']))
                delete this.mundo['casillas'][sposicion]
        }
    }

    this.avanza = function(test){
        /* Determina si puede karel avanzar desde la posición en la que
        se encuentra, de ser posible avanza. Si el parámetro test es
        verdadero solo ensaya. */
        //Determino primero si está en los bordes
        if (this.frente_libre()) {
            this.mundo['karel']['posicion'] = obten_casilla_avance(this.mundo['karel']['posicion'], this.mundo['karel']['orientacion'])
            return true
        } else
            return false
    }

    this.gira_izquierda = function(test){
        /* Gira a Karel 90° a la izquierda, obteniendo una nueva
        orientación. Si el parámetro test es verdadero solo ensaya */
        if (! test)
            this.mundo['karel']['orientacion'] = rotado(this.mundo['karel']['orientacion'])
    }

    this.coge_zumbador = function(test){
        /* Determina si Karel puede coger un zumbador, si es posible lo
        toma, devuelve Falso si no lo logra. Si el parámetro test es
        verdadero solo ensaya. */
        var posicion = this.mundo['karel']['posicion']
        var sposicion = 'c'+posicion[0]+'_'+posicion[1]
        if (this.junto_a_zumbador()) {
            if (this.mundo['casillas'][sposicion]['zumbadores'] == -1) {
                if (! test)
                    if (this.mundo['karel']['mochila'] != -1)
                        this.mundo['karel']['mochila'] += 1
            } else if (this.mundo['casillas'][sposicion]['zumbadores']>0)
                if (! test){
                    if (this.mundo['karel']['mochila'] != -1)
                        this.mundo['karel']['mochila'] += 1
                    this.mundo['casillas'][sposicion]['zumbadores'] -= 1
                }
            //Limpiamos la memoria si es necesario
            if (! (this.mundo['casillas'][sposicion]['paredes'] || this.mundo['casillas'][sposicion]['zumbadores']))
                delete this.mundo['casillas'][sposicion]
            return true
        } else
            return false
    }

    this.deja_zumbador = function(test){
        /* Determina si Karel puede dejar un zumbador en la casilla
        actual, si es posible lo deja. Si el parámetro test es verdadero
        solo ensaya  */
        var posicion = this.mundo['karel']['posicion']
        if (this.algun_zumbador_en_la_mochila()){
            if (! test){
                var sposicion = 'c'+posicion[0]+'_'+posicion[1]
                if (sposicion in this.mundo['casillas']){
                    if (this.mundo['casillas'][posicion]['zumbadores'] != -1)
                        this.mundo['casillas'][posicion]['zumbadores'] += 1
                } else {
                    this.mundo['casillas'][posicion] = {
                        'zumbadores': 1,
                        'paredes': []
                    }
                }
                if (this.mundo['karel']['mochila'] != -1)
                    this.mundo['karel']['mochila'] -= 1
            }
            return true
        } else
            return false
    }

    this.frente_libre = function() {
        /* Determina si Karel tiene el frente libre */
        var direccion = this.mundo['karel']['orientacion']
        var posicion = this.mundo['karel']['posicion']
        if (direccion == 'norte') {
            if (posicion[0] == this.mundo['dimensiones']['filas'])
                return false
        } else if (direccion == 'sur') {
            if (posicion[0] == 1)
                return false
        } else if (direccion == 'este') {
            if (posicion[1] == this.mundo['dimensiones']['columnas'])
                return false
        } else if (direccion == 'oeste') {
            if (posicion[1] == 1)
                return false
        }
        var sposicion = 'c'+posicion[0]+'_'+posicion[1]
        if (! (sposicion in this.mundo['casillas']))
            return true //No hay un registro para esta casilla, no hay paredes
        else{
            if (this.mundo['casillas'][sposicion]['paredes'].indexOf(direccion) != -1)
                return false
            else
                return true
        }
    }

    this.izquierda_libre = function(){
        /* Determina si Karel tiene la izquierda libre */
        var direccion = this.mundo['karel']['orientacion']
        var posicion = this.mundo['karel']['posicion']
        if (direccion == 'norte') {
            if (posicion[1] == 1)
                return false
        } else if (direccion == 'sur') {
            if (posicion[1] == this.mundo['dimensiones']['columnas'])
                return false
        } else if (direccion == 'este') {
            if (posicion[0] == this.mundo['dimensiones']['filas'])
                return false
        } else if (direccion == 'oeste') {
            if (posicion[0] == 1)
                return false
        }
        var sposicion = 'c'+posicion[0]+'_'+posicion[1]
        if (! (sposicion in this.mundo['casillas']))
            return true //No hay un registro para esta casilla, no hay paredes
        else{
            if (this.mundo['casillas'][posicion]['paredes'].indexOf(rotado(direccion)) != -1)
                return false
            else
                return true
        }
    }

    this.derecha_libre = function(){
        /* Determina si Karel tiene la derecha libre */
        var direccion = this.mundo['karel']['orientacion']
        var posicion = this.mundo['karel']['posicion']
        if (direccion == 'norte') {
            if (posicion[1] == this.mundo['dimensiones']['columnas'])
                return false
        } else if (direccion == 'sur') {
            if (posicion[1] == 1)
                return false
        } else if (direccion == 'este') {
            if (posicion[0] == 1)
                return false
        } else if (direccion == 'oeste') {
            if (posicion[0] == this.mundo['dimensiones']['filas'])
                return false
        }
        var sposicion = 'c'+posicion[0]+'_'+posicion[1]
        if (! (sposicion in this.mundo['casillas']))
            return true //No hay un registro para esta casilla, no hay paredes extra
        else{
            if (this.mundo['casillas'][sposicion]['paredes'].indexOf(rotado(rotado(rotado(direccion)))) != -1)
                return false
            else
                return true
        }
    }

    this.junto_a_zumbador = function(){
        /* Determina si Karel esta junto a un zumbador. */
        var sposicion = 'c'+this.mundo['karel']['posicion'][0]+'_'+this.mundo['karel']['posicion'][1]
        if (sposicion in this.mundo['casillas']) {
            if (this.mundo['casillas'][sposicion]['zumbadores'] == -1)
                return true
            else if (this.mundo['casillas'][sposicion]['zumbadores'] > 0)
                return true
            else
                return false
        } else
            return false
    }

    this.orientado_al = function(direccion){
        /* Determina si karel esta orientado al norte */
        if (this.mundo['karel']['orientacion'] == direccion)
            return true
        else
            return false
    }

    this.algun_zumbador_en_la_mochila = function(){
        /* Determina si karel tiene algun zumbador en la mochila */
        if (this.mundo['karel']['mochila'] > 0 || this.mundo['karel']['mochila'] == -1)
            return true
        else
            return false
    }

    this.exporta_mundo = function(){
        /* Exporta las condiciones actuales del mundo usando algun
        lenguaje de marcado */
        var mundo = {
            'karel': {
                'posicion': this.mundo['karel']['posicion'],
                'orientacion': this.mundo['karel']['orientacion'],
                'mochila': this.mundo['karel']['mochila']
            },
            'dimensiones': {
                'filas': this.mundo['dimensiones']['filas'],
                'columnas': this.mundo['dimensiones']['columnas']
            },
            'casillas': []
        }
        for (llave in this.mundo['casillas']){
            mundo['casillas'].push({
                'fila': llave.substr(1).split('_')[0]*1,
                'columna': llave.substr(1).split('_')[1]*1,
                'zumbadores': this.mundo['casillas'][llave]['zumbadores'],
                'paredes': this.mundo['casillas'][llave]['paredes']
            })
        }
        return mundo
    }

    this.exporta_casillas = function(){
        var casillas = []
        for (llave in this.mundo['casillas']){
            casillas.push({
                'fila': llave.substr(1).split('_')[0]*1,
                'columna': llave.substr(1).split('_')[1]*1,
                'zumbadores': this.mundo['casillas'][llave]['zumbadores'],
                'paredes': this.mundo['casillas'][llave]['paredes']
            })
        }
        return casillas
    }

    this.carga_casillas = function(casillas){
        /* Carga las casillas de un diccionario dado. */
        this.mundo_backup_c = this.mundo
        this.mundo['casillas'] = {}
        try {
            for (i==0;i<casillas.length;i++){
                var casilla = casillas[i]
                this.mundo['casillas']['c'+casilla[fila]+'_'+casilla[columna]] = {
                    'zumbadores': casilla['zumbadores'],
                    'paredes': casilla['paredes']
                }
            }
        } catch(e) {
            this.mundo = this.mundo_backup_c
            delete this.mundo_backup_c
            return false
        }
        delete this.mundo_backup_c
        return true
    }

    this.carga_mundo = function(mundo){
        /* Carga el contenido de un archivo con la configuración del
        mundo. Archivo debe ser una instancia de 'file' o de un objeto
        con metodo 'read()' */
        this.mundo_backup = this.mundo
        try {
            this.mundo = {
                'karel': {
                    'posicion': mundo['karel']['posicion'],
                    'orientacion': mundo['karel']['orientacion'],
                    'mochila': mundo['karel']['mochila'] //Zumbadores en la mochila
                },
                'dimensiones': {
                    'filas': mundo['dimensiones']['filas'],
                    'columnas': mundo['dimensiones']['columnas']
                },
                'casillas': {}
            }
            if (! this.carga_casillas(mundo['casillas']))
                throw "Se mando un mundo deforme"
        } catch(e) {
            this.mundo = this.mundo_backup
            delete this.mundo_backup
            return false
        }
        delete this.mundo_backup
        return true
    }

    this.limpiar = function(){
        /* Limpia el mundo y lo lleva a un estado inicial */
        this.mundo = {
            'karel': {
                'posicion': mundo['karel']['posicion'],
                'orientacion': mundo['karel']['orientacion'],
                'mochila': mundo['karel']['mochila'] //Zumbadores en la mochila
            },
            'dimensiones': {
                'filas': mundo['dimensiones']['filas'],
                'columnas': mundo['dimensiones']['columnas']
            },
            'casillas': {}
        }
    }
}

function merge(lista_llaves, lista_valores) {
    /* Combina un par de listas de la misma longitud en un
    diccionario */
    d = {}
    l_valores = lista_valores.slice(0, lista_valores.length)
    //Hacemos una copia de la lista, por que no queremos modificar
    //la lista original, creeme, no lo queremos...
    l_valores.reverse()
    for (i in lista_llaves)
    for (i=0;i<lista_llaves.length;i++)
        d[lista_llaves[i]] = l_valores.pop()
    return d
}

KRunner = function(programa_compilado, mundo, limite_recursion, limite_iteracion, limite_ejecucion, debug) {
    /* Inicializa el ejecutor dados un codigo fuente compilado y un
    mundo, tambien establece el limite para la recursion sobre una
    funcion antes de botar un error stack_overflow.*/
    this.ejecutable = programa_compilado
    if (typeof mundo == 'undefined')
        this.mundo = new KWorld()
    else
        this.mundo = mundo
    this.limite_recursion = typeof limite_recursion == 'undefined' ? 65000 : limite_recursion
    this.limite_iteracion = typeof limite_iteracion == 'undefined' ? 65000 : limite_iteracion
    this.limite_ejecucion = typeof limite_ejecucion == 'undefined' ? 200000 : limite_ejecucion

    this.corriendo = true
    this.indice = 0 //Marcador con la posición en la cinta de ejecución
    this.ejecucion = 0 //Contador del número de instrucciones que se han ejecutado
    this.diccionario_variables = {}

    this.sal_de_instruccion = false
    this.sal_de_bucle = false
    this.pila = [] //La pila de funciones y bucles
    this.profundidad = 0
    //Las anteriores cantidades limitan que tan hondo se puede llegar
    //mediante recursion, y que tanto puede iterar un bucle, esto para
    //evitar problemas al evaluar codigos en un servidor.
    this.estado = "Ok" //El estado en que se encuentra
    this.mensaje = "" //Mensaje con que termina la ejecucion
    this.debug = debug
    //Debug

    this.run = function(){
        /* Ejecuta el codigo compilado de Karel en el mundo
        proporcionado, comenzando por el bloque 'main' o estructura
        principal. */
        this.step_run()
        while (this.corriendo)
            this.step()
    }

    this.step_run = function(){
        /* Prepara las cosas para el step run */
        this.indice = this.ejecutable['main'] //El cabezal de esta máquina de turing
        this.ejecucion = 0
        this.diccionario_variables = {}
    }

    this.expresion_entera = function(valor, diccionario_variables){
        /*Obtiene el resultado de una evaluacion entera y lo devuelve
        */
        if (typeof valor == 'object') {
            //Se trata de un sucede o un precede
            if ('sucede' in valor)
                return this.expresion_entera(valor['sucede'], diccionario_variables)+1
            else
                return this.expresion_entera(valor['precede'], diccionario_variables)-1
        } else if (typeof valor == 'number')
            return valor
        else //Es una variable
            return diccionario_variables[valor] //Esto debe devolver entero
    }

    this.termino_logico = function(lista_expresiones, diccionario_variables){
        /* Obtiene el resultado de la evaluacion de un termino logico 'o'
        para el punto en que se encuentre Karel al momento de la llamada,
        recibe una lista con los terminos a evaluar
        */
        for(i=0;i<lista_expresiones.length;i++) {
            var termino = lista_expresiones[i]
            if (this.clausula_y(termino['y'], diccionario_variables))
                return true
        }
        return false
    }

    this.clausula_y = function(lista_expresiones, diccionario_variables) {
        /* Obtiene el resultado de una comparación 'y' entre terminos
        logicos */
        for(i=0;i<lista_expresiones.length;i++) {
            var termino = lista_expresiones[i]
            if (! this.clausula_no(termino, diccionario_variables))
                return false //El resultado de una evaluacion 'y' es falso si uno de los terminos es falso
        }
        return true
    }

    this.clausula_no = function(termino, diccionario_variables) {
        /* Obtiene el resultado de una negacion 'no' o de un termino
        logico */
        if (typeof termino == 'object') {
            //Se trata de una negacion, un 'o' o un 'si-es-cero'
            if ('no' in termino)
                return ! this.clausula_no(termino['no'], diccionario_variables)
            else if ('o' in termino)
                return this.termino_logico(termino['o'], diccionario_variables)
            else {
                //Si es cero
                if (this.expresion_entera(termino['si-es-cero'], diccionario_variables) == 0)
                    return true
                else
                    return false
            }
        } else {
            //Puede ser una condicion relacionada con el mundo, o verdadero y falso
            if (termino == 'verdadero')
                return true
            else if (termino == 'falso')
                return false
            else if (termino == 'frente-libre')
                return this.mundo.frente_libre()
            else if (termino == 'frente-bloqueado')
                return ! this.mundo.frente_libre()
            else if (termino == 'izquierda-libre')
                return this.mundo.izquierda_libre()
            else if (termino == 'izquierda-bloqueada')
                return ! this.mundo.izquierda_libre()
            else if (termino == 'derecha-libre')
                return this.mundo.derecha_libre()
            else if (termino == 'derecha-bloqueada')
                return ! this.mundo.derecha_libre()
            else if (termino == 'junto-a-zumbador')
                return this.mundo.junto_a_zumbador()
            else if (termino == 'no-junto-a-zumbador')
                return ! this.mundo.junto_a_zumbador()
            else if (termino == 'algun-zumbador-en-la-mochila')
                return this.mundo.algun_zumbador_en_la_mochila()
            else if (termino == 'ningun-zumbador-en-la-mochila')
                return ! this.mundo.algun_zumbador_en_la_mochila()
            else {
                //Es una preguna de orientacion
                if (termino.indexOf('no-') == 0)
                    return ! this.mundo.orientado_al(termino.slice(16)) //Que truco
                else
                    return this.mundo.orientado_al(termino.slice(13)) //Oh si!
            }
        }
    }

    this.step = function(){
        /* Da un paso en la cinta de ejecución de Karel */
        try {
            if (this.corriendo){
                if (this.ejecucion >= this.limite_ejecucion)
                    throw "HanoiTowerException: Tu programa nunca termina ¿Usaste 'apagate'?"
                //Hay que ejecutar la función en turno en el índice actual
                instruccion = this.ejecutable['lista'][this.indice]
                if (typeof instruccion == 'object') {
                    //Se trata de una estructura de control o una funcion definida
                    if ('si' in instruccion) {
                        if (this.debug)
                            console.log('si')
                        if (this.termino_logico(instruccion['si']['argumento']['o'], this.diccionario_variables))
                            this.indice += 1 //Avanzamos a la siguiente posicion en la cinta
                        else //nos saltamos el si, vamos a la siguiente casilla, que debe ser un sino o la siguiente instruccion
                            this.indice = instruccion['si']['fin']+1
                        this.ejecucion += 1
                    } else if ('sino' in instruccion) { //Llegamos a un sino, procedemos, no hay de otra
                        if (this.debug)
                            console.log('sino')
                        this.indice += 1
                        this.ejecucion += 1
                    } else if ('repite' in instruccion) {
                        if (this.debug)
                            console.log('repite', instruccion['repite']['argumento'])
                        if (! this.pila.en_tope(instruccion['repite']['id'])) {
                            argumento = this.expresion_entera(instruccion['repite']['argumento'], this.diccionario_variables)
                            if (argumento < 0)
                                throw "WeirdNumberException: Estás intentando que karel repita un número negativo de veces"
                            this.pila.push({
                                'id': instruccion['repite']['id'],
                                'cuenta': 0,
                                'argumento': argumento,
                                'fin': instruccion['repite']['fin']
                            }) //Cuenta las ejecuciones para este bucle
                        }
                        if (this.pila.top()['argumento']>0) {
                            if (this.pila.top()['cuenta'] == this.limite_iteracion)
                                throw 'LoopLimitExceded: hay un bucle que se cicla'
                            this.indice += 1
                            this.pila.top()['argumento'] -= 1
                            this.pila.top()['cuenta'] += 1
                        } else { //nos vamos al final y extraemos el repite de la pila
                            this.indice = instruccion['repite']['fin']+1
                            this.pila.pop()
                        }
                        this.ejecucion += 1
                    } else if ('mientras' in instruccion) {
                        if (this.debug)
                            console.log('mientras')
                        if (! this.pila.en_tope(instruccion['mientras']['id'])) {
                            this.pila.push({
                                'id': instruccion['mientras']['id'],
                                'cuenta': 0,
                                'fin': instruccion['mientras']['fin']
                            }) //Cuenta las ejecuciones para este bucle
                        }
                        if (this.termino_logico(instruccion['mientras']['argumento']['o'], this.diccionario_variables)) {//Se cumple la condición del mientras
                            if (this.pila.top()['cuenta'] == this.limite_iteracion)
                                throw 'LoopLimitExceded: hay un bucle que se cicla'
                            this.indice += 1
                            this.pila.top()['cuenta'] += 1
                        } else { //nos vamos al final
                            this.indice = instruccion['mientras']['fin']+1
                            this.pila.pop()
                        }
                        this.ejecucion += 1
                    } else if ('fin' in instruccion) { //Algo termina aqui
                        if (this.debug)
                            console.log('fin', instruccion['fin']['estructura'])
                        if (instruccion['fin']['estructura'] == 'mientras' || instruccion['fin']['estructura'] == 'repite')
                            this.indice = instruccion['fin']['inicio']
                        else if (instruccion['fin']['estructura'] == 'si')
                            this.indice = instruccion['fin']['fin']
                        else if (instruccion['fin']['estructura'] == 'sino')
                            this.indice += 1
                        else{ //fin de una funcion
                            nota = this.pila.pop() //Obtenemos la nota de donde nos hemos quedado
                            this.indice = nota['posicion']+1
                            this.diccionario_variables = nota['diccionario_variables']
                            this.profundidad -= 1
                        }
                    } else { //Se trata la llamada a una función
                        if (this.debug)
                            console.log(instruccion['instruccion']['nombre'])
                        if (this.profundidad == this.limite_recursion)
                            throw 'StackOverflow: Karel ha excedido el límite de recursión'
                        //Hay que guardar la posición actual y el diccionario de variables en uso
                        this.pila.push({
                            'posicion': this.indice,
                            'diccionario_variables': this.diccionario_variables
                        })
                        this.profundidad += 1
                        // Lo que prosigue es ir a la definición de la función
                        this.indice = this.ejecutable['indice_funciones'][instruccion['instruccion']['nombre']]+1
                        // recalcular el diccionario de variables
                        valores = []
                        for (i=0;i<instruccion['instruccion']['argumento'].length;i++)
                            valores.push(this.expresion_entera(instruccion['instruccion']['argumento'][i], this.diccionario_variables))
                        this.diccionario_variables = merge(
                            this.ejecutable['lista'][this.indice-1][instruccion['instruccion']['nombre']]['params'],
                            valores
                        )
                        this.ejecucion += 1
                    }
                } else {
                    //Es una instruccion predefinida de Karel
                    if (this.debug)
                        console.log(instruccion)
                    if (instruccion == 'avanza') {
                        if (! this.mundo.avanza())
                            throw 'Karel se ha estrellado con una pared!'
                        this.indice +=1
                    } else if (instruccion == 'gira-izquierda') {
                        this.mundo.gira_izquierda()
                        this.indice +=1
                    } else if (instruccion == 'coge-zumbador') {
                        if (! this.mundo.coge_zumbador())
                            throw 'Karel quizo coger un zumbador pero no habia en su posicion'
                        this.indice +=1
                    } else if (instruccion == 'deja-zumbador') {
                        if (! this.mundo.deja_zumbador())
                            throw 'Karel quizo dejar un zumbador pero su mochila estaba vacia'
                        this.indice +=1
                    } else if (instruccion == 'apagate') {
                        this.corriendo = false //Fin de la ejecución
                        this.estado = 'OK'
                        this.mensaje = 'Ejecucion terminada'
                        return 'TERMINADO'
                    } else if (instruccion == 'sal-de-instruccion') {
                        while (this.pila.top().has_key('id'))
                            this.pila.pop() //Sacamos todos los bucles
                        nota = this.pila.pop() //Obtenemos la nota de donde nos hemos quedado
                        this.indice = nota['posicion']+1
                        this.diccionario_variables = nota['diccionario_variables']
                    } else if (instruccion == 'sal-de-bucle') {
                        bucle = this.pila.pop()
                        this.indice = bucle['fin']+1
                    } else if (instruccion == 'continua-bucle') {
                        bucle = this.pila.top()
                        this.indice = bucle['fin']
                    } else //FIN
                        throw "HanoiTowerException: Tu programa excede el límite de ejecución ¿Usaste 'apagate'?"
                    this.ejecucion += 1
                }
            } else {
                this.estado = 'OK'
                this.mensaje = 'Ejecucion terminada'
                this.corriendo = false
                return 'TERMINADO'
            }
        } catch (e) {
            this.estado = 'ERROR'
            this.mensaje = e
            this.corriendo = false
            return 'ERROR'
        }
        this.estado = 'OK'
        this.mensaje = 'Ejecucion terminada'
        return 'OK'
    }
}

//~ l = new KLexer('iniciar-programa inicia-ejecucion mientras frente-libre hacer avanza; apagate; termina-ejecucion finalizar-programa')
//~ g = new KGrammar(l, false, true, false)
//~ var sintaxis_correcta = false
//~ try {
    //~ g.verificar_sintaxis()
    //~ sintaxis_correcta = true
//~ } catch(e) {
    //~ console.log(e)
//~ }
//~ if(sintaxis_correcta) {
    //~ g.expandir_arbol()
//~
    //~ m = new KWorld()
    //~ m.pon_zumbadores([1, 1], 3)
    //~ m.conmuta_pared([1, 1], 'norte')
//~
    //~ r = new KRunner(g.ejecutable, m)
    //~ r.run()
    //~ console.log(r.estado)
    //~ console.log(r.mensaje)
//~ }
//~
//~ console.log('done!')
