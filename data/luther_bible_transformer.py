# Author: Yist Lin
# Date: 2017-02-18
# This is to insert data of german bible (luther 1912)

from sys import argv
from json import loads
from json import dumps

books_arr = []

with open(argv[1]) as f:

    # read from original JSON format
    json_str = ''.join(f.readlines())
    json_obj = loads(json_str)

    content = json_obj['version']
    for book_key in content:
        # old-form object
        book_obj = content[book_key]
        chap_obj = book_obj['book']
        book_no = book_obj['book_nr']
        book_name = book_obj['book_name']

        # new-form object
        new_book_obj = {'booknumber': book_no, 'bookname': book_name, 'chapters': []}

        for chap_key in chap_obj:
            # old-form object
            chap_no = chap_obj[chap_key]['chapter_nr']
            vers_obj = chap_obj[chap_key]['chapter']

            # new-form object
            new_chap_obj = {'chapternumber': chap_no, 'verses': {}}

            for vers_key in vers_obj:
                vers_no = vers_obj[vers_key]['verse_nr']
                text = vers_obj[vers_key]['verse']
                new_chap_obj['verses'][vers_no] = text

            new_book_obj['chapters'].append(new_chap_obj)

        books_arr.append(new_book_obj)

print(dumps(books_arr, indent=2))

