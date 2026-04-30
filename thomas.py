import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def play_song(song_name):
    print(f"🤖 Thomas: Buscando por '{song_name}' no YouTube...")
    
    # Configurações do Chrome
    chrome_options = Options()
    
    # 1. Permite autoplay sem interação do usuário
    chrome_options.add_argument("--autoplay-policy=no-user-gesture-required")
    
    # 2. Oculta o navegador movendo-o para fora da tela (evita detecção de bot do modo headless)
    chrome_options.add_argument("--window-position=-2000,0")
    
    # Outras opções úteis para rodar de forma mais limpa
    chrome_options.add_argument("--disable-infobars")
    chrome_options.add_argument("--disable-notifications")
    
    # Mantém o navegador aberto após o script terminar sua execução principal
    chrome_options.add_experimental_option("detach", True)
    
    # Inicializa o WebDriver
    try:
        driver = webdriver.Chrome(options=chrome_options)
    except Exception as e:
        print("❌ Erro ao iniciar o Chrome. Verifique se o ChromeDriver está instalado e atualizado.")
        print(f"Detalhes: {e}")
        return

    try:
        # 3. Pesquisa no YouTube
        search_query = song_name.replace(' ', '+')
        url = f"https://www.youtube.com/results?search_query={search_query}"
        driver.get(url)
        
        # Aguarda até que o primeiro vídeo da lista de resultados carregue e seja clicável
        wait = WebDriverWait(driver, 10)
        first_video_xpath = '(//ytd-video-renderer//a[@id="video-title"])[1]'
        first_video = wait.until(EC.element_to_be_clickable((By.XPATH, first_video_xpath)))
        
        # 4. Clica no primeiro vídeo
        print("✅ Vídeo encontrado. Iniciando...")
        first_video.click()
        
        # Aguarda um pouco para a página do vídeo carregar e a tag <video> ser instanciada
        time.sleep(3)
        
        # 5. Força o play e garante que não está mutado usando JavaScript
        print("🎵 Forçando reprodução e ativando áudio...")
        
        js_script = """
        var video = document.querySelector('video');
        if (video) {
            // Garante que o áudio não esteja mutado e o volume esteja no máximo
            video.muted = false;
            video.volume = 1.0;
            
            // Tenta forçar o play
            var playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    console.log('Autoplay iniciado com sucesso.');
                }).catch(error => {
                    console.log('Autoplay bloqueado, tentando simular clique...');
                    // Simula um clique no botão de play caso o autoplay seja bloqueado pelo navegador
                    var playButton = document.querySelector('.ytp-play-button');
                    if (playButton) {
                        playButton.click();
                    }
                });
            }
        }
        """
        driver.execute_script(js_script)
        
        print(f"▶️ Tocando agora: {song_name} (O navegador está rodando oculto em segundo plano).")
        print("Pressione Ctrl+C no terminal para encerrar a música e fechar o navegador.")
        
        # Mantém o script rodando para que o usuário possa encerrar com Ctrl+C
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Encerrando o Thomas e fechando o player...")
        driver.quit()
    except Exception as e:
        print(f"❌ Ocorreu um erro durante a automação: {e}")
        driver.quit()

def main():
    print("="*50)
    print("🤖 Assistente Thomas - Player de Música")
    print("="*50)
    
    # Verifica se o comando foi passado como argumento na linha de comando
    if len(sys.argv) > 1:
        command = " ".join(sys.argv[1:]).lower()
    else:
        command = input("Digite o comando (ex: 'tocar linkin park numb'): ").lower()
        
    if command.startswith("tocar ") or command.startswith("pesquisar "):
        if command.startswith("tocar "):
            query = command.replace("tocar ", "", 1).strip()
        else:
            query = command.replace("pesquisar ", "", 1).strip()
            
        if query:
            play_song(query)
        else:
            print("⚠️ Por favor, informe o que deseja pesquisar ou tocar. Ex: tocar linkin park")
    else:
        print("⚠️ Comando não reconhecido. Use o formato: tocar [nome] ou pesquisar [nome]")

if __name__ == "__main__":
    main()
