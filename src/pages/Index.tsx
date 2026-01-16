import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface VerificationData {
  name: string;
  age: string;
  contact: string;
  contactType: 'email' | 'phone';
  company: string;
  verificationCode: string;
  photo?: string;
  movieName?: string;
  movieDate?: string;
  movieTime?: string;
}

const MUSIC_TRACKS = [
  'https://cdn.poehali.dev/projects/d8db035b-4f3f-4320-946f-f65eee67ced7/bucket/Fiksaj_Vremya.mp3',
  'https://cdn.poehali.dev/projects/d8db035b-4f3f-4320-946f-f65eee67ced7/bucket/Fiksaj_Mednyj_gorod.mp3',
  'https://cdn.poehali.dev/projects/d8db035b-4f3f-4320-946f-f65eee67ced7/bucket/iksajj_NEVYNOSIMYJJ_80227348_V1.mp4',
  'https://cdn.poehali.dev/projects/d8db035b-4f3f-4320-946f-f65eee67ced7/bucket/Фиксай моя жизнь моё шоу.MP3'
];

export default function Index() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('verify');
  const [step, setStep] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.2);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: '',
    contactType: 'email' as 'email' | 'phone',
    company: '',
    verificationCode: '',
    photo: null as File | null,
    movieName: '',
    movieDate: '',
    movieTime: ''
  });

  const [checkCode, setCheckCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [verifiedData, setVerifiedData] = useState<VerificationData | null>(null);
  const [verifications, setVerifications] = useState<VerificationData[]>([]);

  useEffect(() => {
    const audio = new Audio(MUSIC_TRACKS[currentTrack]);
    audio.volume = volume;
    audio.loop = false;
    audioRef.current = audio;

    audio.play().catch(() => {
      console.log('Autoplay blocked');
    });

    audio.addEventListener('ended', () => {
      const nextTrack = (currentTrack + 1) % MUSIC_TRACKS.length;
      setCurrentTrack(nextTrack);
    });

    const volumeInterval = setInterval(() => {
      setVolume(prev => {
        const newVolume = Math.min(prev + 0.1, 1.5);
        if (audioRef.current) {
          audioRef.current.volume = Math.min(newVolume, 1);
        }
        return newVolume;
      });
    }, 60000);

    return () => {
      audio.pause();
      audio.remove();
      clearInterval(volumeInterval);
    };
  }, [currentTrack]);

  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleContactVerification = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      const response = await fetch('https://functions.poehali.dev/527e4f05-b364-4900-8184-94230c600c55', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactType: formData.contactType,
          contact: formData.contact,
          code: code
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Код отправлен!",
          description: `Проверочный код ${code} отправлен на ${formData.contact}`,
        });
        setFormData({ ...formData, verificationCode: code });
        setStep(2);
      } else {
        toast({
          title: "Ошибка отправки",
          description: result.error || "Не удалось отправить код. Проверьте настройки.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка сети",
        description: "Не удалось связаться с сервером отправки кодов",
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      toast({
        title: "Фото загружено",
        description: "Фотография успешно загружена для проверки возраста",
      });
    }
  };

  const handleSubmitVerification = () => {
    if (enteredCode !== formData.verificationCode) {
      toast({
        title: "Неверный код!",
        description: "Введённый код не совпадает с отправленным",
        variant: "destructive"
      });
      return;
    }

    const verificationCode = generateVerificationCode();
    const newVerification: VerificationData = {
      name: formData.name,
      age: formData.age,
      contact: formData.contact,
      contactType: formData.contactType,
      company: formData.company,
      verificationCode,
      movieName: formData.movieName,
      movieDate: formData.movieDate,
      movieTime: formData.movieTime
    };

    setVerifications([...verifications, newVerification]);
    setFormData({ ...formData, verificationCode });
    setStep(3);

    toast({
      title: "Верификация завершена!",
      description: `Ваш код: ${verificationCode}`,
    });
  };

  const handleCheckCode = () => {
    const found = verifications.find(v => v.verificationCode === checkCode.toUpperCase());
    if (found) {
      setVerifiedData(found);
      toast({
        title: "Данные найдены",
        description: "Верификация успешно проверена",
      });
    } else {
      toast({
        title: "Код не найден",
        description: "Проверьте правильность введенного кода",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <Icon name="ShieldCheck" size={48} className="text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Система Верификации
          </h1>
          <p className="text-purple-200">
            Безопасная проверка данных с подтверждением личности
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-scale-in">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="verify" className="flex items-center gap-2">
              <Icon name="UserCheck" size={18} />
              Пройти верификацию
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Icon name="Search" size={18} />
              Проверить код
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verify">
            <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Icon name="ClipboardCheck" size={24} />
                  Форма верификации
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Заполните данные для прохождения проверки
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Полное имя</Label>
                      <Input
                        id="name"
                        placeholder="Иван Иванов"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-slate-700/50 border-purple-500/30 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-white">Возраст</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="25"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="bg-slate-700/50 border-purple-500/30 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactType" className="text-white">Тип контакта</Label>
                      <Select
                        value={formData.contactType}
                        onValueChange={(value: 'email' | 'phone') => 
                          setFormData({ ...formData, contactType: value })
                        }
                      >
                        <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Телефон</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact" className="text-white">
                        {formData.contactType === 'email' ? 'Email' : 'Номер телефона'}
                      </Label>
                      <Input
                        id="contact"
                        placeholder={formData.contactType === 'email' ? 'example@mail.com' : '+7 999 123 45 67'}
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="bg-slate-700/50 border-purple-500/30 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-white">Компания для проверки</Label>
                      <Select
                        value={formData.company}
                        onValueChange={(value) => setFormData({ ...formData, company: value })}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
                          <SelectValue placeholder="Выберите компанию" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="films">Кинокомпания</SelectItem>
                          <SelectItem value="retail">Розничная торговля</SelectItem>
                          <SelectItem value="finance">Финансы</SelectItem>
                          <SelectItem value="other">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleContactVerification}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!formData.name || !formData.age || !formData.contact || !formData.company}
                    >
                      <Icon name="Send" size={18} className="mr-2" />
                      Отправить код подтверждения
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                      <p className="text-purple-200 text-sm">
                        <Icon name="Info" size={16} className="inline mr-2" />
                        Код подтверждения отправлен на {formData.contact}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verificationCode" className="text-white">
                        Введите код из {formData.contactType === 'email' ? 'письма' : 'SMS'}
                      </Label>
                      <Input
                        id="verificationCode"
                        placeholder="123456"
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value)}
                        className="bg-slate-700/50 border-purple-500/30 text-white text-center text-2xl tracking-widest"
                        maxLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo" className="text-white">
                        <Icon name="Camera" size={18} className="inline mr-2" />
                        Фото для подтверждения возраста
                      </Label>
                      <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center bg-slate-700/20 hover:bg-slate-700/30 transition-colors cursor-pointer">
                        <input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <label htmlFor="photo" className="cursor-pointer">
                          {formData.photo ? (
                            <div className="text-green-400">
                              <Icon name="CheckCircle" size={32} className="mx-auto mb-2" />
                              <p>Фото загружено</p>
                            </div>
                          ) : (
                            <div className="text-purple-300">
                              <Icon name="Upload" size={32} className="mx-auto mb-2" />
                              <p>Нажмите для загрузки фото</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {formData.company === 'films' && (
                      <div className="space-y-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg animate-scale-in">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <Icon name="Film" size={20} />
                          Дополнительная проверка для кинокомпании
                        </h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="movieName" className="text-white">Название фильма</Label>
                          <Input
                            id="movieName"
                            placeholder="Введите название фильма"
                            value={formData.movieName}
                            onChange={(e) => setFormData({ ...formData, movieName: e.target.value })}
                            className="bg-slate-700/50 border-purple-500/30 text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="movieDate" className="text-white">Дата показа</Label>
                            <Input
                              id="movieDate"
                              type="date"
                              value={formData.movieDate}
                              onChange={(e) => setFormData({ ...formData, movieDate: e.target.value })}
                              className="bg-slate-700/50 border-purple-500/30 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="movieTime" className="text-white">Время показа</Label>
                            <Input
                              id="movieTime"
                              type="time"
                              value={formData.movieTime}
                              onChange={(e) => setFormData({ ...formData, movieTime: e.target.value })}
                              className="bg-slate-700/50 border-purple-500/30 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSubmitVerification}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!formData.photo || !enteredCode || enteredCode.length !== 6 || (formData.company === 'films' && (!formData.movieName || !formData.movieDate || !formData.movieTime))}
                    >
                      <Icon name="CheckCircle" size={18} className="mr-2" />
                      Завершить верификацию
                    </Button>
                  </div>
                )}

                {step === 3 && (
                  <div className="text-center space-y-4 animate-fade-in">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-8">
                      <Icon name="CheckCircle" size={64} className="mx-auto text-green-400 mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Верификация завершена!
                      </h3>
                      <p className="text-purple-200 mb-4">
                        Ваш уникальный код верификации:
                      </p>
                      <div className="bg-slate-700/50 border-2 border-purple-500 rounded-lg p-4">
                        <p className="text-4xl font-mono font-bold text-purple-400 tracking-widest">
                          {formData.verificationCode}
                        </p>
                      </div>
                      <p className="text-sm text-purple-200 mt-4">
                        Сохраните этот код для проверки администратором
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        setStep(1);
                        setEnteredCode('');
                        setFormData({
                          name: '',
                          age: '',
                          contact: '',
                          contactType: 'email',
                          company: '',
                          verificationCode: '',
                          photo: null,
                          movieName: '',
                          movieDate: '',
                          movieTime: ''
                        });
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Новая верификация
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Icon name="Key" size={24} />
                  Проверка верификации
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Введите код для просмотра данных верификации
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkCode" className="text-white">
                      Код верификации
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="checkCode"
                        placeholder="ABC123"
                        value={checkCode}
                        onChange={(e) => setCheckCode(e.target.value)}
                        className="bg-slate-700/50 border-purple-500/30 text-white uppercase"
                        maxLength={6}
                      />
                      <Button
                        onClick={handleCheckCode}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={checkCode.length !== 6}
                      >
                        <Icon name="Search" size={18} />
                      </Button>
                    </div>
                  </div>

                  {verifiedData && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <Icon name="UserCheck" size={24} />
                          Данные верификации
                        </h3>
                        
                        <div className="grid gap-3">
                          <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
                            <span className="text-purple-300">Имя:</span>
                            <span className="text-white font-semibold">{verifiedData.name}</span>
                          </div>
                          
                          <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
                            <span className="text-purple-300">Возраст:</span>
                            <span className="text-white font-semibold">{verifiedData.age} лет</span>
                          </div>
                          
                          <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
                            <span className="text-purple-300">
                              {verifiedData.contactType === 'email' ? 'Email:' : 'Телефон:'}
                            </span>
                            <span className="text-white font-semibold">{verifiedData.contact}</span>
                          </div>
                          
                          <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
                            <span className="text-purple-300">Компания:</span>
                            <span className="text-white font-semibold">
                              {verifiedData.company === 'films' ? 'Кинокомпания' :
                               verifiedData.company === 'retail' ? 'Розничная торговля' :
                               verifiedData.company === 'finance' ? 'Финансы' : 'Другое'}
                            </span>
                          </div>

                          {verifiedData.company === 'films' && (
                            <div className="mt-4 p-4 bg-purple-500/10 rounded-lg space-y-2">
                              <h4 className="text-white font-semibold flex items-center gap-2">
                                <Icon name="Film" size={18} />
                                Данные о фильме
                              </h4>
                              <div className="flex justify-between">
                                <span className="text-purple-300">Название:</span>
                                <span className="text-white">{verifiedData.movieName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-300">Дата:</span>
                                <span className="text-white">{verifiedData.movieDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-300">Время:</span>
                                <span className="text-white">{verifiedData.movieTime}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setVerifiedData(null);
                          setCheckCode('');
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Проверить другой код
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-purple-300 text-sm animate-fade-in">
          <Icon name="Lock" size={16} className="inline mr-2" />
          Все данные защищены end-to-end шифрованием
        </div>
      </div>
    </div>
  );
}