'use strict';

(o) => {
  let data = o['bot'].base.open('macros');

  console.log(data);

  if(o['arg'][0] == 'write') {
    o['$'].callMethod('messages.getById', {message_ids: o['body'][1]}, (ans) => {
      ans = JSON.parse(ans)['response']['items'][0];
      let macros = {
        text: o['text'],
        owner: ans['user_id']
      }, name;
      if(o['arg'][1] === undefined) {
        name = 'test' + parseInt(Math.random() * 50000000);
      } else {
        name = o['arg'][1];
      }
      if(name in data.read('macros')) {
        if(data.read('macros')[name]['owner'] != ans['user_id']) {
          o['bot'].send(`Это имя занято`, o['body'], {});
        }
        else {
          data.data['macros'][name] = macros;
          data.write('macros', data.data['macros']);
          o['bot'].send(`Макрос перезаписан под именем ${name}`, o['body'], {});
        }
      } else {
        data.data['macros'][name] = macros;
        data.write('macros', data.data['macros']);
        o['bot'].send(`Макрос сохранен под именем ${name}`, o['body'], {});
      }
    });
  }

  if(o['arg'][0] == 'run' || o['arg'][0] === undefined) {
    o['$'].callMethod('messages.getChat', {chat_id: o['body'][3] - 2e9, fields: 'first_name, last_name'}, (ans) => {
      try {
        ans = JSON.parse(ans)['response']['users'];
        let macMap = new Map(), rand, replace;

        macMap.set('user', (word) => {
          rand = parseInt(Math.random() * Object.keys(ans).length - 1);
          if(word == 'first')
            return `${ans[rand]['first_name']}`;
          else if(word == 'last')
            return `${ans[rand]['last_name']}`;
          else
            return `${ans[rand]['first_name']} ${ans[rand]['last_name']}`;
        });
        macMap.set('num', () => parseInt(Math.random() * 1000));
        macMap.set('word', (word) => {
          if(word !== undefined) {
            word = word.split(',').map((key) => key.trim());
            return word[parseInt(Math.random() * word.length)];
          } else {
            return 'word указан неправильно';
          }
        });

        if(o['arg'][1] !== undefined) {
          try {
            replace = data.read(`macros->${o['arg'][1]}->text`).replace(/(%(\w+)(=(.+?)|)%)/g, (match, p1, p2, p3, p4) => macMap.get(p2)(p4));
            o['bot'].send(`-- ${replace}`, o['body'], {});
          } catch(e) {
            o['bot'].send(`Макрос не найден`, o['body'], {});
          }
        } else {
          replace = o['text'].replace(/(%(\w+)(=(.+?)|)%)/g, (match, p1, p2, p3, p4) => macMap.get(p2)(p4)).replace(/\w+\.\w{2,6}/g, '');
          o['bot'].send(`-- ${replace}`, o['body'], {});
        }
      } catch(e) {
        console.log(e);
      }
    });
  }


  /*o['$'].callMethod('messages.getChat', {chat_id: o['body'][3] - 2e9, fields: 'first_name, last_name'}, (ans) => {
    try {
      ans = JSON.parse(ans)['response']['users'];
      let macMap = new Map(), rand, data, replace;

      macMap.set('user', (word) => {
        rand = parseInt(Math.random() * Object.keys(ans).length - 1);
        if(word === undefined) {
          return `${ans[rand]['first_name']} ${ans[rand]['last_name']}`;
        } else {
          if(word == 'first')
            return `${ans[rand]['first_name']}`;
          else if(word == 'last')
            return `${ans[rand]['last_name']}`;
          else
            return `${ans[rand]['first_name']} ${ans[rand]['last_name']}`;
        }
      });
      macMap.set('num', () => parseInt(Math.random() * 1000));
      macMap.set('word', (word) => {
        if(word !== undefined) {
          word = word.split(',').map((key) => key.trim());
          return word[parseInt(Math.random() * word.length)];
        } else {
          return 'word указан неправильно';
        }
      });

      replace = o['text'].replace(/(%(\w+)(=(.+?)|)%)/g, (match, p1, p2, p3, p4) => macMap.get(p2)(p4)).replace(/\w+\.\w{2,6}/g, '');
      o['bot'].send(`-- ${replace}`, o['body'], {});
    } catch(e) {
      console.log(e);
    }
  });*/
}
