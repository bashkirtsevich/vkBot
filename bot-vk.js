'use strict';

let apiVK         = require('./api-vk'),
    api           = new apiVK('login', 'password'),
    EventEmitter  = require('events'),
    logger        = require('./botmodule/log'),
    random        = require('./botmodule/rand'),
    fs            = require('fs'),
    base          = require('./botmodule/base.js'),
    vm            = require('vm');

class botVK extends EventEmitter {
  variable() {
    this.typeBot  = 0;
    this.nameBot  = 'хохол';
    this.letBot   = '!';
    this.limit    = {};
    this.blockUrl = {'vkbot': false, 'vto': false, 'vklike': false, 'likest': false, 'vkway': false, 'vkobmen': false};
  }

  launch(callback) {
    api.auth(() => {

      this.api   = api;

      this.base  = base;

      this.token = api.token;

      this.variable();

      api.longPoll((body) => {
        this.getMessage(body);
      });

      callback();
    });
  }

  getMessage(body) {
    body = body['updates'];

    for(let i = 0; i <= Object.keys(body).length - 1; i++) {
      if(6 in body[i]) {
        this.filterMessage(body[i]);
      }
    }
  }

  filterMessage(body) {
    for(let key in this.blockUrl)
      body[6] = body[6].replace(new RegExp(`${key}`, 'g'), '');
    if(this.typeBot === 0 || this.typeBot === 3)
      this.strictFind(body);
    if(this.typeBot === 1 || this.typeBot === 3)
      this.softFind(body);
    console.log(body[6]);
  }

  strictFind(body) {
    let template = new RegExp(`^\\${this.letBot}([\\wА-я]+)(\\[(.+)\\])?`), bodyMod = body[6], find = bodyMod.match(template);

    if(find !== null) {
      if(this.messageLimit(body, 20) === false)
        return false;
      let command = find[1],
          arg     = (find[3] !== undefined) ? find[3].split(',').map((key) => key.trim()) : {} ,
          text    = bodyMod.replace(template, '').trim();
      try {
        this.emit(command, text, arg, body);
      } catch(e) {
        logger.error('[strictFind]', e);
      }
    }
  }

  softFind(body) {
    let bodyMod = body[6], templateNameBot = new RegExp(`^${this.nameBot}`), templateCommand = new RegExp(`^([\\wА-я]+)(\\[(.+)\\])?`);

    if(bodyMod.toLowerCase().match(templateNameBot)) {
      bodyMod = bodyMod.toLowerCase().replace(templateNameBot, '').replace(',', '').trim();

      if(bodyMod.match(templateCommand)) {
        if(this.messageLimit(body, 20) === false)
          return false;
        bodyMod = bodyMod.toLowerCase();
        let find    = bodyMod.match(templateCommand),
            command = find[1],
            arg     = (find[3] !== undefined) ? find[3].split(',').map((key) => key.trim()) : {} ,
            text    = bodyMod.replace(templateCommand, '').trim();
        try {
          this.emit(command, text, arg, body);
        } catch(e) {
          logger.error('[softFind]', e);
        }
      }
    }
  }


  callScript(path, options) {
    try {
      let data = fs.readFileSync(path, {encoding: 'utf8'});
      let script = new vm.Script(data);
      script.runInThisContext()(options);
    } catch(e) {
      logger.error('[callSCript]', e);
    }
  }

  messageLimit(body, num) {
    let conf = body[3], status = true;
    if(conf in this.limit) {
      if(this.limit[conf]['msg'] === num) {
        status = false;
        if(this.limit[conf]['timeout'] === false) {
          setTimeout(() => {
            this.limit[conf]['msg'] = 0;
            this.limit[conf]['timeout'] = false;
          }, 60000);
          this.limit[conf]['timeout'] = true;
        }
      } else {
        if(this.limit[conf]['msg'] === (num-2))
          this.send('Через 2 сообщения бот будет игнорировать конференцию на 1 минуту', body, {});
        this.limit[conf]['msg']++;
      }
    } else {
      this.limit[conf] = {};
      this.limit[conf]['msg'] = 0;
      this.limit[conf]['timeout'] = false;
    }
    return status;
  }

  send(text, body, options) {
    let option = {
      attachMessage: true,
      attach:        false
    };
    for(let key in options)
      option[key] = options[key];
    let object = {
      message:      text,
      guid:         random.random(0, 50000),
    };

    object['peer_id'] = body[3];

    if(option['attachMessage'] === true)
      object['forward_messages'] = body[1];

    if(typeof(option['attach']) == 'object') {
      let attach = '', index = 0;
      for(let key in options['attach']) {
        attach += options['attach'][key];
        if(index > 0) attach += ',';
        index++;
      }
      object['attachment'] = attach;
    }

    api.callMethod('messages.send', object, (zz) => {
      console.log(zz);
    });
  }

  setTypeBot(int) {
    if(int <= 3)
      this.typeBot = int;
    else
      logger.error('[modeBot] Режим бота может быть от 0 до 3');
  }

}

module.exports = botVK;
