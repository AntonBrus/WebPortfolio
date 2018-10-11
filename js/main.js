/**
 * Библиотека для организации подгрузки данных с сервера.
 * Поддерживаются режимы работы:
 * 1. dataList.runOnClickBtn(); - подгрузка новой порции данных по клику на кнопке dataList.selectorButton;
 * 2. dataList.onLoadData(); - подгрузка новой порции данных при прокрутке страницы до метки с классом point.
 * @method structureItem содержит структуру 1 записи.
 * Если необходимо отобразить другие данные, необходимо переопределить метод structureItem.
 */
let dataList = {
    startData: 0, //Начальный указатель на выборку (позиция выборки)
    selectorLoaderImage: '#list-posts-loader', //id gif изображения лоадера
    selectorButton: '#list-posts-btn', //Селектор кнопки для подгрузки новой порции данных
    selectorContainerForContent: '#posts',
    serverScriptURL: './cgi-bin/server.py', //"./server.json - для локальной проверки

    //Блока AJAX запроса, иначе может уйти несколько почти одновременных одинаковых запросов
    flagLoadDataNow: false, //false - данные не загружаются на сервер

    /**
     * Метод позволяет изменить параметры по умолчанию.
     *
     * @param options Переопределение параметров по умолчанию
     */
    setOptions: function(options){
        for (let option in options){
            if(!options.hasOwnProperty(option)){continue;}
            if (options[option]){
                this[option] = options[option];
            }
        }
    },

    /**
     * Первый вариант работы библиотеки.
     * Данные подгружаются после клика на кнопку.
     * Селектор, определяющий кнопку this.selectorButton
     */
    runOnClickBtn: function () {
        $(this.selectorLoaderImage).hide(); //Выбираем экран ожидания и скрываем его
        $(this.selectorButton).on('click', this.onLoadData.bind(this)); //Обрабатываем нажатие на кнопку получения данных
    },

    /**
     * Вспомогательный метод, который отправляет AJAX запрос на сервер.
     * this.serverScriptURL - URL-адрес страницы с новой порцией записей в формате json.
     */
    onLoadData: function () {
        let self = this; //Для замыкания, чтобы переменная была доступна внутри ajax запроса
        let $loaderImage = $(this.selectorLoaderImage); //Выбираем экран ожидания

        //AJAX запрос на сервер, для получения данных
        $.ajax({
            url: this.serverScriptURL, //URL сервера (Backend)
            type: 'get', //Тип запроса GET
            data: {"listNewsOffset": self.startData}, //Отступ от начала выборки
            dataType: 'json', //Формат, в котором мы ожидаем данные
            cache: false, //Отключаем кэширование данных
            //Реализуем блокировку в методе, чтобы нельзя было отправить почти одновременно несколько запросов
            beforeSend: function () {
                //Защита от дублирования AJAX запросов
                if(self.flagLoadDataNow){
                    //Если запрос уже начат, прерываем все последующие запросы,
                    //чтобы избежать дублирования
                    return false;
                }
                //Если поток свободен, устанавливаем блокировку
                self.flagLoadDataNow = true;
                //console.log('Установлена блокировка');

                $loaderImage.show(); //Показываем экран ожидания
                return true; //Разрешаем отправку запроса
            },
            //Если запрос успешно выполнен
            success: function (data) {
                //Если нет записей для отображения
                if(data.length === 0){
                    console.log('Отсутствуют новые записи');
                    //Скрываем экран ожидания
                    $loaderImage.hide();
                    //Скрываем кнопку получения новых записей, так как записи закончились
                    $(self.selectorButton).hide();
                    return; //Выход
                }

                //Строим структуру для каждой записи
                for (let i = 0; i < data.length; i++)
                {
                    //Создание элемента DOM
                    let htmlCode = self.structureItem(data[i]);
                    //Добавляем запись на страницу
                    $(self.selectorContainerForContent).append(htmlCode);
                    //Увеличиваем счетчик полученных записей
                    self.startData++;
                }

                //Добавляем метку, где была выведена крайняя запись
                let $point = $('<hr class="point">');
                //Удаляем все метки, если они ранее были добавлены
                $(self.selectorContainerForContent).find('.point').remove();
                //Добавляем единственную правильную метку
                $(self.selectorContainerForContent).append($point);

                //Скрываем экран ожидания, так как данные уже получены
                $loaderImage.hide();
                //Запрос выполнес, снимаем блокировку
                self.flagLoadDataNow = false;
                //console.log('Блокировка успешно снята');
            }
        });
    },

    /**
     * Второй вариант работы библиотеки.
     * Подгрузка новой порции данных как только пользователь прокрутил страницу до метки с классом point.
     */
    runOnScroll: function () {
        let self = this;

        //Скрываем экран ожидания
        $(self.selectorLoaderImage).hide();
        //Скрываем кнопку подгрузки записей, так как теперь за это быдут отвечать событие scroll
        $(self.selectorButton).hide();

        $(document).on('scroll', function () {
            //Находим точку, где заканчиваются уже полученные записи
            let point = $('.point:last').offset().top;
            //Насколько пикселей сейчас прокручена страница по вертикали
            //Высота окна при этом не учитывается
            let scrollNow = $(this).scrollTop();
            //Текущая высота окна
            let height = $(window).height();
            //Флаг, нужно ли подгружать новую порцию данных
            let loadDataFlag = scrollNow + height >= point;

            //Подгружаем новую порцию данных с помщью self.onLoadData()
            //Если страница прокручена не до метки, не подгружаем данные
            if(loadDataFlag){
                self.onLoadData(); //Получаем записи посредством AJAX
            }

        });
    },

    /**
     * Метод создает структуру 1 записи, ранее полученной с сервера.
     *
     * @param element Объект 1 записи
     * @return {jQuery|HTMLElement} Созданный элемент DOM
     */
    structureItem: function (element) {
        //Контейнер для одной записи
        let $container = $('<div />', {
            class: 'item'
        });

        let $itemTitle = $('<h3 />', {
            class: 'item__title',
            text: element.title
        });

        let $itemAuthor = $('<div />', {
            class: 'item__author',
            text: 'Автор: ' + element.author
        });

        let $itemContent = $('<div />', {
            class: 'item__content',
            html: element.content
        });

        //Объединяем элементы, чтобы получить структуру записи
        $itemTitle.appendTo($container);
        $itemAuthor.appendTo($container);
        $itemContent.appendTo($container);

        return $container;
    }
};