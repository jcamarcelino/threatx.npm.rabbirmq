
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


## 📦  Semantic release 
O @semantic-release usa convenções de commit baseadas no padrão Conventional Commits para determinar automaticamente o tipo de versão (major, minor, patch) e gerar changelogs e tags. Aqui está um resumo das regras principais:

### 📌 Estrutura básica de um commit:
```bash
<tipo>[escopo opcional]: <descrição>
```
### ✅ Tipos comuns:
* feat: Uma nova funcionalidade (gera uma minor release).
* fix: Correção de bug (gera uma patch release).
* docs: Mudanças na documentação.
* style: Alterações de formatação, sem impacto no código.
* refactor: Refatoração de código, sem mudança de funcionalidade.
* perf: Melhorias de performance.
* test: Adição ou modificação de testes.
* chore: Tarefas auxiliares (ex: atualizações de dependências).
* ci: Mudanças em configurações de integração contínua.

🚨 Para gerar uma versão major:
Use BREAKING CHANGE: no corpo do commit ou adicione um ! após o tipo:
```bash
feat!: nova estrutura de filas quorum
```
ou 
```bash
feat: nova estrutura de filas quorum
BREAKING CHANGE: a estrutura anterior de filas foi removida
```
### 🔍 Exemplos:
* feat(queue): suporte a filas do tipo quorum
* fix(rabbitmq): correção no binding de exchange
* chore(deps): atualização do amqplib para versão mais recente

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
## 📄 Licença

MIT © Julio Cesar de Almeida Marcelino
