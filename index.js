const { networkInterfaces, uptime, loadavg } = require('os')
const filesize = require('filesize')
const { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, subSeconds } = require('date-fns')
const chalkAnimation = require('chalk-animation')
const cursor = require('cli-cursor')
const systeminformation = require('systeminformation')

const ZERO_WIDTH_SPACE = '\u200b'

const cliRows = process.stdout.rows
const cliColumns = process.stdout.columns

start()

async function start () {
  const strs = await generateStrs()
  const longestStrWidth = getLongestStrWidth(strs)
  const isTooSmall = cliColumns < longestStrWidth || cliRows < strs.length

  if (isTooSmall) return

  process.on('SIGINT', () => {
    console.clear()
    cursor.show()
    process.exit()
  })

  console.clear()
  cursor.hide()

  const boxedStr = await generateCenteredStr(strs)
  const animation = chalkAnimation.rainbow(boxedStr, 0.5).stop()

  setInterval(async () => {
    const frame = animation.frame()
    console.log(frame.replace(new RegExp(ZERO_WIDTH_SPACE, 'g'), ' ')) // Hack to make chalk-animation include spaces in its animation calculation
  }, 50)
}

async function generateStrs () {
  const mem = await systeminformation.mem()
  const info = {
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
        return `${fixedLengthStr(name, 8)}  ::  ${str}`
      })
      .filter(a => !!a)
  }

  // Use this version for a smaller yin/yang symbol
  // const strs = [
  //   '         _..oo8"""Y8b.._',
  //   '     .88888888o.    "Yb.',
  //   '   .d888P""Y8888b      "b.',
  //   '  o88888    88888)       "b',
  //   ` d888888b..d8888P         'b     uptime    ::  ${info.uptime}`,
  //   ` 88888888888888"           8     load avg  ::  ${info.load}`,
  //   `(88DWB8888888P             8)    ${info.ipsAsStrs[0] || ''}`,
  //   ` 8888888888P               8     ${info.ipsAsStrs[1] || ''}`,
  //   ` Y88888888P     ee        .P     ${info.ipsAsStrs[2] || ''}`,
  //   '  Y888888(     8888      oP',
  //   '   "Y88888b     ""     oP"',
  //   '     "Y8888o._     _.oP"',
  //   '       `""Y888boodP""\''
  // ]

  const strs = [
    '            .,ad88888888baa,',
    '        ,d8P"""        ""9888ba.',
    '     .a8"          ,ad88888888888a',
    '    aP\'          ,88888888888888888a',
    '  ,8"           ,88888888888888888888,',
    ' ,8\'            (888888888( )888888888,',
    ',8\'             `8888888888888888888888',
    `8)               '888888888888888888888,     uptime    ::  ${info.uptime}`,
    `8                  "8888888888888888888)     load avg  ::  ${info.load}`,
    `8                   '888888888888888888)     memory    ::  ${info.memory}`,
    `8)                    "8888888888888888      ${info.ipsAsStrs[0] || ''}`,
    `(b                     "88888888888888'      ${info.ipsAsStrs[1] || ''}`,
    `'8,        (8)          8888888888888)       ${info.ipsAsStrs[2] || ''}`,
    ' "8a                   ,888888888888)',
    '   V8,                 d88888888888"',
    '    `8b,             ,d8888888888P\'',
    '      `V8a,       ,ad8888888888P\'',
    '         ""88888888888888888P"',
    '              """"""""""""',
  ]
  return strs
}

async function generateCenteredStr (strs) {
  const longestStrWidth = getLongestStrWidth(strs)
  const strsWithFixedLength = strs.map(str => fixedLengthStr(str, longestStrWidth))
  const strsWithoutRealSpaces = strsWithFixedLength.map(str => str.replace(/ /g, ZERO_WIDTH_SPACE)) // Replace all spaces with a similar character. Otherwise chalk-animation won't calculate correctly
  const str = strsWithoutRealSpaces.join('\n')
  const strRows = str.split('\n').length
  const marginTop = Math.max(Math.floor((cliRows - strRows) / 2), 0)
  const centerStr = str.split('\n').map(s => center(s, cliColumns)).join('\n')
  return Array(marginTop).fill('\n').join('') + centerStr
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

function fixedLengthStr (str, length) {
  return str + Array(Math.max(length - str.length, 0)).fill(' ').join('')
}

function center (str, width) {
  return Array(Math.floor((width - str.length) / 2)).join(' ') + str
}

function plural (str, count) {
  return `${str}${count === 1 ? '' : 's'}`
}

function getLongestStrWidth (strs) {
  return Math.max(...strs.map(s => s.length))
}
