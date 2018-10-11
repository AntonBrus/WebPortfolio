#!/usr/bin/env python3

print("Content-type: application/json; charset=utf-8")
print()


# Модуль для работы с MySQL
import pymysql
# Модуль для получения GET параметров
import cgi
# Модуль для работы с json
import json
# Модуль для работы со временем
import time

# Параметры
# Количество записей на 1 страницу
listNewsOnPageParam = 10

# Получение cgi для работы с параметрами скрипта
getCgi = cgi.FieldStorage()

# Получение GET параметра listNewsOffset
# Количество записей, которое нужно пропустить с самого начала
listNewsOffsetParam = getCgi.getvalue('listNewsOffset')

# Проверка на существование параметра listNewsOffset
if not listNewsOffsetParam:
    # Начинаем отображать записи с самого начала
    listNewsOffsetParam = 0
else:
    # Преобразовываем значение параметра к числу, иначе не получится его вставить в sql запрос
    listNewsOffsetParam = int(listNewsOffsetParam)

# Подключение к базе данных
connection = pymysql.connect(host='localhost',
                             user='autolist_local',
                             password='autolist_local',
                             db='autolist_local',
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)

try:
    with connection.cursor() as cursor:
        # Выполняем запрос для выборки данных
        cursor.execute("SELECT * FROM `datalist` LIMIT %s,%s", (listNewsOffsetParam, listNewsOnPageParam))

        # Извлекаем все полученные данные
        dataRows = cursor.fetchall()
        print(json.dumps(dataRows))
finally:
    # Закрываем соединение с базой данных
    connection.close()

    # Пауза в 1 секунду, чтобы успел отобразиться экран ожидания
    time.sleep(1)