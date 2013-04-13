/*
 * Analizador léxico para Karel escrito en javascript, especialmente
 * adaptado para el navegador
 */
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
                    throw KarelException("Caracter desconocido en la linea %d columna %d"%(this.linea, this.columna))
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
                    throw KarelException("Caracter desconocido en la linea %d columna %d"%(this.linea, this.columna))
                if (this.numeros.indexOf(this.caracter_actual) != -1)
                    this.token += this.caracter_actual
                else if (this.palabras.indexOf(this.caracter_actual) != -1) //Encontramos una letra en el estado numero, incorrecto
                    throw KarelException("Este token no parece valido, linea %d columna %d"%(this.linea, this.columna))
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
                    throw KarelException("Caracter desconocido en la linea %d columna %d"%(this.linea, this.columna))
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
        if (self.token_actual.es_primer_token)
            return self.lexer.linea - 1
        else
            return self.lexer.linea
    }

    this.avanza_token = function(){
        /* Avanza un token en el archivo */
        siguiente_token = self.lexer.get_token()

        if (siguiente_token.token != ''){
            if (self.sintaxis == 'pascal')
                siguiente_token.lower()
            self.token_actual = siguiente_token
            return true
        } else
            return false
    }
}

l = new KLexer('')
g = new KGrammar(l)

console.log('done!')
