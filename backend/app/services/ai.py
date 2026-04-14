import os
import json
import google.generativeai as genai 


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def generate_subtasks_from_title(task_title:str,task_description:str="")->list[dict]:
    model=genai.GenerativeModel('gemini-2.5-flash')


    prompt=f"""
    You are an expert technical project manager.
    Break down the following task into 3 to 5 highly actionable subtasks.


    Task Title: {task_title}
    Task Description: {task_description}

    You must respond with a raw JSON array of objects. Do not use markdown formatting or code blocks.
    Format exactly like this:
    [
        {{"title": "Subtask 1 string"}},
        {{"title": "Subtask 2 string"}}
    ]"""


    response=model.generate_content(prompt)

    try:
        raw_json=response.text.replace("```json","").replace("```", "").strip()
        subtasks=json.loads(raw_json)
        return subtasks

    except json.JSONDecodeError:
        return [{"title":"Review AI suggestions manually"}]

    except Exception as e:
        return [{"title":"Error generating subtasks"}]