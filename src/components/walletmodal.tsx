import { Dialog, Transition, Listbox } from '@headlessui/react'
import { Fragment, useState, useEffect, useContext } from 'react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

import { Saira, Aclonica } from 'next/font/google';
import { BrowserWallet, Transaction } from '@meshsdk/core';
import { UserContext } from '@/contexts/UserProvider';
import { useRouter } from 'next/router'

import api from '@/constants/auth';
import toast from 'react-hot-toast';

const saira = Saira({
  weight: '400',
  subsets: ['latin']
})

const people = [
  { id: 1, name: 'Durward Reynolds', unavailable: false },
  { id: 2, name: 'Kenton Towne', unavailable: false },
  { id: 3, name: 'Therese Wunsch', unavailable: false },
  { id: 4, name: 'Benedict Kessler', unavailable: true },
  { id: 5, name: 'Katelyn Rohan', unavailable: false },
]

export default function Modal(props: { show: boolean; closeModal: any; confirm?: boolean }) {
  const { show, closeModal, confirm } = props;
  const router = useRouter();
  const [wallets, setWallets] = useState([Object]);
  const [mywallet, setWallet] = useState<object>();
  const [ballance, setBallance] = useState<number>(0);
  // const [myaddress, setAddress] = useState<string>();
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [selected, setSelected] = useState({
    name: "Select wallet",
  })

  //@ts-ignore
  const { myProfile, setMyProfile } = useContext(UserContext);

  useEffect(() => {
    getWallets();
  }, [])

  
  useEffect(() => {
    if (selected.name != 'Select wallet' && selected) {
      walletConnect(selected.name);
    }
  }, [selected])

  const getWallets = () => {
    const wallets = BrowserWallet.getInstalledWallets();
    setWallets(wallets);
  }

  const walletConnect = async (walletName: string) => {
    BrowserWallet.enable(walletName).then(
      wallet => {
        setWallet(wallet);
        wallet.getBalance().then(
          ballance => {
            if (ballance[0].quantity != 0) {
              // @ts-ignore
              setBallance(Math.floor(ballance[0].quantity / 1000000));
              // setDepositAmount(Math.floor(ballance[0].quantity / 1000000));
            } else {
              setBallance(ballance[0].quantity);
              setDepositAmount(ballance[0].quantity);
            }
          }
        ).catch(
          err => {
            toast.error("We can't connect your wallet.")
            setBallance(0);
          }
        )
      }
    ).catch(error => {
      toast.error("We can't connect your wallet.")
      setBallance(0);
      console.log('cant connect wallet')
    })
  }

  const handleChange = async (e: any) => {
    const mount = e.target.value;
    setDepositAmount(mount);
  }

  const depositFunc = async () => {
    // api.post('/users/deposit', {address: myaddress, mount: depositAmount}).then(
    //   res => console.log(res)
    // ).catch(err => console.log(err))
    if(!mywallet) return;
    
    if (depositAmount == 0 && !confirm) {
      toast.error('Please fill the correct balance.')
    } else {
      const amount: string = ((Number(depositAmount) + 1) * 1000000).toString();
      const tx = new Transaction({ initiator: mywallet })
        .sendLovelace(
          process.env.NEXT_PUBLIC_WALLET_ADDRESS,
          confirm?"10000000":amount
        )
        ;

      try {
        const unsignedTx = await tx.build();
        //@ts-ignore
        const signedTx = await mywallet.signTx(unsignedTx);
        //@ts-ignore
        const txHash = await mywallet.submitTx(signedTx);
        if (txHash) {
          const total = Number(myProfile.balance) + Number(depositAmount);
          if(confirm){
            api.post('/users/verify', {userid: myProfile._id}).then(
              res => {
                toast.success("Verification succeed");
                router.reload()
              }
            ).catch(
              err => toast.error(err)
            )
          } else {
            api.post('/users/deposit', { totalBalance: total }).then(
              res => {
                toast.success("Deposit succeed")
                closeModal();
                setDepositAmount(0)
                setMyProfile(res.data);
                router.reload();
              }
            ).catch(
              err => toast.error(err)
            )
          }
        }
      } catch (error) {
        toast.error("You dont have enough balance to deposit.")
      }
    }
  }

  return (
    <>
      <Transition appear show={show || false} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className={`fixed inset-0 overflow-y-auto ${saira.className}`}>
            <div className="flex min-h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full transform overflow-hidden rounded-lg bg-white dark:bg-dark-header-bg dark:text-white p-0 text-left align-middle shadow-xl transition-all max-w-[335px] sm:max-w-[488px]">
                  <Dialog.Title
                    as="h3"
                    className='text-lg text-[24px] font-semibold leading-8 text-primary dark:text-white p-5'
                  >
                    Deposit
                  </Dialog.Title>
                  <hr />
                  <div className="p-5">
                    {
                      wallets.length != 0 ? (
                        <Listbox value={selected} onChange={setSelected}>
                          <div className="relative mt-1">
                            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-dark-body-bg py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                              <span className="block truncate">{selected.name}</span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                  className="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                              </span>
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark-body-bg py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                {wallets.map((wallet, walletIdx) => (
                                  <Listbox.Option
                                    key={walletIdx}
                                    className={({ active }) =>
                                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 dark:bg-dark-body-bg text-amber-900 dark:text-white' : 'text-gray-900 dark:text-white'
                                      }`
                                    }
                                    value={wallet}
                                    onSelect={() => walletConnect(wallet.name)}
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span
                                          className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                            }`}
                                        >
                                          {wallet.name}
                                        </span>
                                        {selected ? (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600 dark:text-white">
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      ) : (
                        <h1 className='text-gray-900 font-medium dark:text-white'>No wallet. Please install any wallet.</h1>
                      )
                    }
                    <div className='flex justify-between items-center mt-5'>
                      <h1 className='text-grey-2 font-normal text-[14px] leading-[18px]'>
                        {confirm && 'Amount: 10'}
                      </h1>
                      <h1 className='text-grey-2 font-normal text-[14px] leading-[18px]'>
                        Available amount: &nbsp;
                        <span className='text-medium'>
                          {ballance} ADA
                        </span>
                      </h1>
                    </div>
                    {
                      !confirm && (
                        <div className='flex justify-between items-center py-3 px-4 border border-border-color bg-main-bg-color dark:bg-dark-body-bg rounded-lg mt-2'>
                          <input type="number" value={depositAmount} min={1} max={ballance - 1} className='dark:bg-dark-body-bg border-0 font-medium truncate w-full text-right ...' onChange={handleChange} />
                          <span className={`px-2 py-1 text-primary text-[12px] font-medium leading-[14px] border-border-color border ${ballance && (depositAmount >= ballance) ? 'opacity-100' : 'opacity-0'}`}>
                            MAX
                          </span>
                        </div>
                      )
                    }
                    {
                      !confirm && (
                        <div className='flex justify-end mt-2'>
                          <h1 className='text-grey-2 font-normal text-[14px] leading-[18px]'>
                            Fee: &nbsp;
                            <span className='text-medium'>
                              1 ADA
                            </span>
                          </h1>
                        </div>
                      )
                    }
                    {/* <div className='flex justify-center items-center flex-col gap-2 mt-6'>
                      <h1 className='text-grey-2 font-normal text-[14px] leading-[18px]'>
                        Transaction Fee:  &nbsp;
                        <span className='text-medium text-primary'>
                          1 ADA
                        </span>
                      </h1>
                      <h1 className='text-grey-2 font-normal text-[14px] leading-[18px]'>
                        You will get:  &nbsp;
                        <span className='text-medium text-primary'>
                          { depositAmount && (Number(depositAmount) - 1)} ADA
                        </span>
                      </h1>
                    </div> */}
                    <button className='px-8 py-2 rounded-lg bg-secondary w-full mt-6' onClick={depositFunc}>
                      <div className='flex gap-4 items-center justify-center'>
                        <h1 className='text-white font-medium leading-[24px] text-center text-base'>
                          Deposit
                        </h1>
                      </div>
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
