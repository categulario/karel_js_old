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
        "def",
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

            this.arbol['main'] = this.ruby_codeblock([], False, False)
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
                    es_valido = False
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

l = new KLexer('iniciar-programa define-nueva-instruccion a como avanza; inicia-ejecucion termina-ejecucion finalizar-programa')
g = new KGrammar(l, false, true, false)
g.verificar_sintaxis()

console.log(g.expandir_arbol())
console.log('done!')
