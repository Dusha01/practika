from flask import Flask, render_template, jsonify
import xml.etree.ElementTree as ET
import json
from flask_cors import CORS



app=Flask(__name__)
CORS(app)

def xml_to_dict(element):
    result = {}
    if element.attrib:
        result['@attributes'] = element.attrib
    
    for child in element:
        child_data = xml_to_dict(child)
        
        if child.tag in result:
            if isinstance(result[child.tag], list):
                result[child.tag].append(child_data)
            else:
                result[child.tag] = [result[child.tag], child_data]
        else:
            result[child.tag] = child_data
    
    if element.text and element.text.strip():
        if result:
            result['#text'] = element.text.strip()
        else:
            result = element.text.strip()
    
    return result

def load_schedule_data():
    try:
        tree = ET.parse('data.xml')
        root = tree.getroot()

        xml_dict = xml_to_dict(root)

        json_data = json.dump(xml_dict, indent=2)

        return json_data
    except Exception as e:
        print(f'Error: {e}')



@app.route('/')
def index():
    return render_template('index.html')



@app.route('/data')
def get_data():
    try:
        json_data = load_schedule_data()
        if json_data:
            return jsonify(json.loads(json_data))
        else:
            return jsonify({"error": "Не удалось загрузить данные"}), 500
    except Exception as e:
        print(f"Ошибка в /data: {str(e)}")
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)