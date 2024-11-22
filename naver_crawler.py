import requests
from bs4 import BeautifulSoup
from xml.etree.ElementTree import Element, SubElement, tostring
import re
from datetime import datetime, timedelta
import pytz

def Naver_Crawler(query):
    base_url = f"https://search.naver.com/search.naver?where=news&query={query}&start=1&sort=1&pd=13"

    # HTTP 요청 헤더 설정
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    }

    # 네이버 뉴스 검색 결과 가져오기
    response = requests.get(base_url, headers=headers)
    if response.status_code != 200:
        print(f"Error: HTTP {response.status_code}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')

    # 뉴스 기사 추출
    articles = []
    for news_item in soup.select(".news_area"):
        title_tag = news_item.select_one(".news_tit")  # 제목 태그
        desc_tag = news_item.select_one(".dsc_txt_wrap")  # 요약 태그
        date_tag = news_item.select_one(".info_group")  # 날짜와 신문사 정보가 있는 그룹

        pub_date = None
        if date_tag:
            # 날짜와 시간 추출
            for span in date_tag.select("span.info"):
                text = span.get_text(strip=True)
                # 날짜 처리
                pub_date = parse_pub_date(text)
                if pub_date:  # 유효한 날짜를 찾으면 중단
                    break

        if title_tag and desc_tag and pub_date:
            articles.append({
                "title": title_tag.get_text(strip=True),
                "link": title_tag['href'],
                "description": desc_tag.get_text(strip=True),
                "pub_date": pub_date
            })

    # RSS XML 생성
    rss = Element('rss', version='2.0')
    channel = SubElement(rss, 'channel')
    title = SubElement(channel, 'title')
    title.text = f"네이버 뉴스 검색: {query}"
    link = SubElement(channel, 'link')
    link.text = base_url
    description = SubElement(channel, 'description')
    description.text = f"네이버 뉴스 검색 결과 - 키워드: {query}"

    for article in articles:
        item = SubElement(channel, 'item')
        item_title = SubElement(item, 'title')
        item_title.text = article["title"]
        item_link = SubElement(item, 'link')
        item_link.text = article["link"]
        item_description = SubElement(item, 'description')
        item_description.text = article["description"]
        item_pub_date = SubElement(item, 'pubDate')
        item_pub_date.text = article["pub_date"]

    # XML 문자열로 반환
    return tostring(rss, encoding='utf-8').decode('utf-8')


def parse_pub_date(text):
    """네이버 뉴스의 날짜/시간 텍스트를 RFC 822 형식으로 변환"""
    if not text or text == "날짜 정보 없음":
        return None

    now = datetime.now(pytz.utc)

    # 시간 계산 매핑
    time_mappings = [
        (r"방금", lambda: now),
        (r"(\d+)시간 전", lambda m: now - timedelta(hours=int(m.group(1)))),
        (r"(\d+)분 전", lambda m: now - timedelta(minutes=int(m.group(1)))),
        (r"(\d+)일 전", lambda m: now - timedelta(days=int(m.group(1)))),
        (r"(\d{4})\.(\d{2})\.(\d{2})\.",
         lambda m: datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), tzinfo=pytz.utc))
    ]

    for pattern, handler in time_mappings:
        match = re.search(pattern, text)
        if match:
            pub_date = handler(match)
            return pub_date.replace(minute=0, second=0, microsecond=0).strftime("%a, %d %b %Y %H:%M:%S GMT")

    return None

