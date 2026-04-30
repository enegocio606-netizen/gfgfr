import speech_recognition as sr
import pyttsx3
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def init_engine():
    """Inicializa o motor de síntese de voz (Text-to-Speech)"""
    engine = pyttsx3.init()
    # Configura a velocidade da voz
    engine.setProperty('rate', 160)
    return engine

def speak(engine, text):
    """Faz o assistente falar o texto fornecido"""
    print(f"Thomas: {text}")
    engine.say(text)
    engine.runAndWait()

def play_on_youtube(engine, song_name):
    """Usa o Selenium para abrir o YouTube, pesquisar e tocar a música"""
    speak(engine, f"Buscando {song_name} no YouTube.")
    
    # Configura o Selenium para manter o navegador aberto após o script terminar
    options = webdriver.ChromeOptions()
    options.add_experimental_option("detach", True)
    
    try:
        # Inicializa o WebDriver do Chrome
        driver = webdriver.Chrome(options=options)
        driver.maximize_window()
        
        # Formata a URL de pesquisa do YouTube
        search_query = song_name.replace(' ', '+')
        url = f"https://www.youtube.com/results?search_query={search_query}"
        
        driver.get(url)
        
        # Aguarda até que o primeiro vídeo da lista de resultados seja clicável (máximo 10 segundos)
        wait = WebDriverWait(driver, 10)
        
        # O XPath abaixo procura o primeiro link de título de vídeo dentro de um renderizador de vídeo
        first_video_xpath = '(//ytd-video-renderer//a[@id="video-title"])[1]'
        first_video = wait.until(EC.element_to_be_clickable((By.XPATH, first_video_xpath)))
        
        # Clica no vídeo para iniciar a reprodução
        first_video.click()
        
        speak(engine, "Reproduzindo agora. Aproveite!")
        
    except Exception as e:
        print(f"Erro de automação: {e}")
        speak(engine, "Desculpe, ocorreu um erro ao tentar abrir o vídeo no YouTube.")

def listen_command():
    """Ouve o microfone e reconhece o comando de voz"""
    recognizer = sr.Recognizer()
    engine = init_engine()
    
    with sr.Microphone() as source:
        print("Ajustando para o ruído ambiente... Aguarde.")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        
        speak(engine, "Olá, eu sou o Thomas. O que você gostaria de ouvir?")
        print("Ouvindo...")
        
        try:
            # Escuta o áudio do microfone
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            print("Reconhecendo...")
            
            # Usa a API do Google para reconhecer o áudio em Português
            command = recognizer.recognize_google(audio, language='pt-BR').lower()
            print(f"Você disse: '{command}'")
            
            # Verifica se a palavra "tocar" está no comando
            if "tocar" in command:
                # Extrai o nome da música (tudo que vem depois de "tocar")
                parts = command.split("tocar", 1)
                if len(parts) > 1:
                    song_name = parts[1].strip()
                    if song_name:
                        play_on_youtube(engine, song_name)
                    else:
                        speak(engine, "Por favor, diga o nome da música após o comando tocar.")
            else:
                speak(engine, "Comando não reconhecido. Diga 'tocar' seguido do nome da música.")
                
        except sr.WaitTimeoutError:
            print("Nenhum som detectado. Tempo esgotado.")
        except sr.UnknownValueError:
            speak(engine, "Desculpe, não consegui entender o que você disse.")
        except sr.RequestError as e:
            print(f"Erro no serviço de reconhecimento de voz: {e}")
            speak(engine, "Estou sem conexão com o serviço de reconhecimento de voz.")

if __name__ == "__main__":
    # Para rodar este script, você precisará instalar as dependências:
    # pip install SpeechRecognition pyaudio selenium pyttsx3
    listen_command()
