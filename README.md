
# 📦 @threatx/threatx.npm.rabbirmq

Biblioteca para facilitar a integração com RabbitMQ utilizando o protocolo AMQP, fornecendo implementações de Publisher e Consumer para projetos Node.js/TypeScript.

## ✨ Recursos
* Publicador genérico para envio de mensagens.
* Consumer genérico compatível com topologias fanout e direct.
* Implementação orientada a objetos e seguindo princípios de Clean Code.
* Suporte a TypeScript.
* Compatível com Node.js >= 18.18.

## 🚀 Instalação

```bash
npm install @threatx/threatx.npm.rabbirmq
```
    
## 📘 Uso básico

### Publisher

```javascript
import { Publisher } from '@threatx/threatx.npm.rabbirmq';

(async () => {
  const publisher = new Publisher({
    uri: 'amqp://localhost',
    exchange: 'my-exchange',
    exchangeType: 'fanout', // ou 'direct'
  });

  await publisher.connect();
  await publisher.publish({ message: 'Hello RabbitMQ!' });
})();

```
### Consumer

```javascript
import { Consumer } from '@threatx/threatx.npm.rabbirmq';

(async () => {
  const consumer = new Consumer({
    uri: 'amqp://localhost',
    exchange: 'my-exchange',
    exchangeType: 'fanout', // ou 'direct'
    queue: 'my-queue',
    routingKey: '', // obrigatório para direct
  });

  await consumer.connect();
  await consumer.consume(async (msg) => {
    console.log('Mensagem recebida:', msg);
  });
})();

```
## ✅ Requisitos
* Node.js >= 18.18
* RabbitMQ em execução

## 🛠 Scripts Disponíveis
* npm run build → Compila o TypeScript para JavaScript.
* npm run release → Gera versão e publica usando semantic-release.

### 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
### 📄 Licença

MIT © Julio Cesar de Almeida Marcelino
