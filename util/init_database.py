# Модуль для работы с базой данных MySQL
import pymysql.cursors
# Модуль для работы со временем
import time
# Модуль для получения случайного индекса
from random import randrange
# Модуль os для работы с файлами
import os


# Вспомогательная функция для чтения данных из файлов
def file_get_contents(filename):
    if os.path.exists(filename):
        fp = open(filename, 'r')
        content = fp.read()
        fp.close()
        return content


# Подключение к базе данных
connection = pymysql.connect(host='localhost',
                             user='autolist_local',
                             password='autolist_local',
                             db='autolist_local',
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)

# Параметры
# Количество записей, которое мы добавляем в таблицу
paramCountStr = 35
paramAuthorNames = ["Anna", "Olga", "Alex", "Anton", "Igor", "John", "Nata", "Peter", "Vova", "Kate"]

try:
    with connection.cursor() as cursor:
        # Получаем содержимое файла sql с запросом для создания таблицы в БД
        sql = file_get_contents('./table_datalist.sql')
        # Создаем таблицу в БД
        cursor.execute(sql)
        connection.commit()

        # Цикл для добавления записей, так как более 1 записи
        for i in range(1, paramCountStr + 1):
            # Шаблон для вставки записи
            templateTitle = 'Название новости ' + str(i)
            templateContent = 'Содержимое новости для отображения ' + str(i)
            templateAuthor = paramAuthorNames[randrange(0, len(paramAuthorNames))]
            templateDate = time.time()

            # Подготавливаем sql запрос
            sql = "INSERT INTO `datalist` (`title`, `content`, `author`, `date`) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (templateTitle, templateContent, templateAuthor, templateDate))

    # Фиксируем изменения в базе данных
    connection.commit()

finally:
    # Закрываем соединение с базой данных
    connection.close()