from datetime import datetime

import pytz
import requests
import pandas as pd
from xml.etree.ElementTree import Element, SubElement, tostring
from datetime import datetime, timedelta

Google_API_KEY = "AIzaSyC_pq1LZvvZsCzvoPUQg27rM8n7T1cvn1c"
Google_SEARCH_ENGINE_ID = "e72bd2b8f39894d8d"
Trash_Link = ["tistory", "kin", "youtube", "blog", "book", "news", "dcinside", "fmkorea", "ruliweb", "theqoo",
              "clien", "mlbpark", "instiz", "todayhumor"]
Wanted_row = 10

# Google API를 사용하는 함수
def Google_API(query):
    query = query.replace("|", "OR")


    start_pages = []
    df_google = pd.DataFrame(columns=['Title', 'Link', 'Description'])
    row_count = 0

    # 날짜 범위 추가
    date_range = set_date_range("1주")
    if date_range:
        query += f"&sort=date:r:{date_range}"

    # 원하는 페이지 수 만큼 start_pages 설정
    for i in range(1, Wanted_row + 1000, 10):
        start_pages.append(i)

    for start_page in start_pages:
        url = f"https://www.googleapis.com/customsearch/v1?key={Google_API_KEY}&cx={Google_SEARCH_ENGINE_ID}&q={query}&start={start_page}"
        data = requests.get(url).json()
        search_items = data.get("items")
        print(f"url: {url}")

        try:
            for i, search_item in enumerate(search_items, start=1):
                # extract the page url
                link = search_item.get("link")
                if any(trash in link for trash in Trash_Link):
                    pass
                else:
                    # get the page title
                    title = search_item.get("title")
                    # page snippet
                    description = search_item.get("snippet")
                    # add result to DataFrame
                    df_google.loc[start_page + i] = [title, link, description]
                    row_count += 1
                    if (row_count >= Wanted_row) or (row_count == 300):
                        return df_google
        except Exception as e:
            print(f"Error: {e}")
            return df_google

    return df_google

# 날짜 범위를 설정하는 함수
def set_date_range(option):
    if option == "1일":
        days = 1
    elif option == "1주":
        days = 7
    elif option == "2주":
        days = 14
    elif option == "한달":
        days = 30
    elif option == "1년":
        days = 365
    else:
        return ""

    today = datetime.now()
    start_date = today - timedelta(days=days)
    # dateRestrict 형식에 맞게 변환 (YYYY-MM-DD)
    return f"{start_date.strftime('%Y%m%d')}:{today.strftime('%Y%m%d')}"

# RSS XML 생성 함수
def Google_RSS(df):
    # RSS 기본 구조
    rss = Element('rss', version='2.0')
    channel = SubElement(rss, 'channel')

    # 채널 정보 추가
    title = SubElement(channel, 'title')
    title.text = "Google Search Results"

    link = SubElement(channel, 'link')
    link.text = "https://www.google.com"

    description = SubElement(channel, 'description')
    description.text = "RSS Feed for Google Search Results"

    # 현재 시간을 UTC로 설정
    tz = pytz.timezone('UTC')
    current_time = datetime.now(tz).strftime('%a, %d %b %Y %H:%M:%S GMT')

    # DataFrame의 각 행을 item으로 추가
    for index, row in df.iterrows():
        item = SubElement(channel, 'item')
        item_title = SubElement(item, 'title')
        item_title.text = row['Title']

        item_link = SubElement(item, 'link')
        item_link.text = row['Link']

        item_description = SubElement(item, 'description')
        item_description.text = row['Description']

        # pubDate 추가 (현재 시간 기준)
        pubDate = SubElement(item, 'pubDate')
        pubDate.text = current_time

    # XML 문자열로 반환
    return tostring(rss, encoding='utf-8').decode('utf-8')

