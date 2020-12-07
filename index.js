const { networkInterfaces, hostname, freemem, totalmem, uptime, loadavg } = require('os')
const filesize = require('filesize')
const { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, subSeconds } = require('date-fns')
const chalkAnimation = require('chalk-animation')
const cursor = require('cli-cursor')
const boxen = require('boxen')
const systeminformation = require('systeminformation')

const ZERO_WIDTH_SPACE = '\u200b'

process.on('SIGINT', () => {
  console.clear()
  cursor.show()
  process.exit()
})

console.clear()
cursor.hide()
start()

async function start() {
  const str = await getBoxedStr()
  const animation = chalkAnimation.rainbow(str, 0.5)
  setInterval(async () => {
    const str = await getBoxedStr()
    animation.replace(str)
  }, 1000)
}

async function getBoxedStr () {
  const mem = await systeminformation.mem()
  const info = {
    host: hostname(),
    uptime: getUptimeStr(),
    memory: `${filesize(mem.available, { round: 0 })}/${filesize(mem.total, { round: 0 })} (${Math.floor(100 * (mem.available / mem.total))}%)`,
    load: loadavg().map(i => i.toFixed(2)).join(', '),
    ipsAsStrs: Object
      .entries(networkInterfaces())
      .map(([name, nets]) => {
        const netsIPv4 = nets.filter(net => net.family === 'IPv4')
        if (name.indexOf('lo') === 0) return // ignore loopbacks
        if (!netsIPv4.length) return // ignore non-ipv4
        const str = netsIPv4.map(({ address }) => address).join(', ')
        return `${fixedStr(name, 8)}  ::  ${str}`
      })
      .filter(a => !!a)
  }

  const str = [
    fixedStr('            .,ad88888888baa,', 100),
    fixedStr('        ,d8P"""        ""9888ba.', 100),
    fixedStr('     .a8"          ,ad88888888888a', 100),
    fixedStr('    aP\'          ,88888888888888888a', 100),
    fixedStr('  ,8"           ,88888888888888888888,', 100),
    fixedStr(' ,8\'            (888888888( )888888888,', 100),
    fixedStr(',8\'             `8888888888888888888888', 100),
    fixedStr(`8)               '888888888888888888888,     uptime    ::  ${info.uptime}`, 100),
    fixedStr(`8                  "8888888888888888888)     load avg  ::  ${info.load}`, 100),
    fixedStr(`8                   '888888888888888888)     memory    ::  ${info.memory}`, 100),
    fixedStr(`8)                    "8888888888888888      ${info.ipsAsStrs[0] || ''}`, 100),
    fixedStr(`(b                     "88888888888888'      ${info.ipsAsStrs[1] || ''}`, 100),
    fixedStr(`'8,        (8)          8888888888888)       ${info.ipsAsStrs[2] || ''}`, 100),
    fixedStr(' "8a                   ,888888888888)', 100),
    fixedStr('   V8,                 d88888888888"', 100),
    fixedStr('    `8b,             ,d8888888888P\'', 100),
    fixedStr('      `V8a,       ,ad8888888888P\'', 100),
    fixedStr('         ""88888888888888888P"', 100),
    fixedStr('              """"""""""""', 100)
  ].join('\n').replace(/ /g, ZERO_WIDTH_SPACE) // Replace all spaces with a similar character. Otherwise chalk-animation won't calculate correctly
  const cliRows = process.stdout.rows
  const strRows = str.split('\n').length
  const padding = 1
  const marginTop = Math.max(Math.floor((cliRows - strRows) / 2) - (2 * padding), 0)
  return boxen(str, {
    padding,
    float: 'center',
    margin: { top: marginTop }
  })
}

function getUptimeStr () {
  const startDate = subSeconds(new Date(), uptime())
  const days = differenceInDays(new Date(), startDate)
  const hours = differenceInHours(new Date(), startDate) % 24
  const minutes = differenceInMinutes(new Date(), startDate) % 60
  const seconds = differenceInSeconds(new Date(), startDate) % 60
  const res = []
  if (days > 0) res.push(`${days} ${plural('day', days)}`)
  if (hours > 0) res.push(`${hours} ${plural('hour', hours)}`)
  if (minutes > 0) res.push(`${minutes} ${plural('minute', minutes)}`)
  if (seconds > 0) res.push(`${seconds} ${plural('second', seconds)}`)
  return res.join(', ')
}

function fixedStr(str, length) {
  return str + Array(Math.max(length - str.length, 0)).fill(' ').join('')
}

function plural(str, count) {
  return `${str}${count === 1 ? '' : 's'}`
}
