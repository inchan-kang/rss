from flask import Flask, request, Response, send_from_directory
from naver_crawler import Naver_Crawler
from google_custom_search import Google_API
from google_custom_search import Google_RSS
import os

# Flask 앱 초기화
app = Flask(__name__, static_folder='html')  # 'html' 폴더를 static 폴더로 설정

# 정적 파일을 제공하는 경로 설정 (html 폴더에 있는 index.html 파일)
@app.route('/')
def index():
    return send_from_directory(os.path.join(app.root_path, 'html'), 'index.html')

# CSS와 JS 파일을 정적 폴더에서 제공
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(app.root_path, 'html'), filename)

@app.route('/rss', methods=['GET'])
def rss_feed():
    query = request.args.get('q')
    engine = request.args.get('engine')
    if engine not in ('naver', 'google'):
        engine = 'naver'

    if not query:
        return "쿼리 값이 필요합니다. ?q=키워드를 입력하세요.", 400

    if engine != 'google':
        xml_data = Naver_Crawler(query)
    else:
        search_result_json = Google_API(query)
        print(f"search_result_json: {search_result_json}")
        xml_data = Google_RSS(search_result_json)

    # XML을 반환
    return Response(xml_data, content_type='application/xml; charset=utf-8')



# 이 코드가 실행되면 Flask 서버가 시작됨
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=1001)
